import {
  IHVConfig,
  VaultClient,
} from '@creditkarma/vault-client'

import {
  KvStore,
} from '@creditkarma/consul-client'

import {
  ConfigLoader,
} from './ConfigLoader'

import {
  CONFIG_PATH,
  CONSUL_ADDRESS,
  CONSUL_KEYS,
  CONSUL_KV_DC,
  HVAULT_CONFIG_KEY,
} from './constants'

import {
  Just,
  Maybe,
  Nothing,
} from './Maybe'

import * as utils from './utils'

import {
  ConsulFailed,
  ConsulNotConfigured,
  DynamicConfigInvalidObject,
  DynamicConfigMissingKey,
  HVFailed,
  HVNotConfigured,
  MissingConfigPlaceholder,
} from './errors'

import {
  ConfigPlaceholder,
  IConfigOptions,
  ISchema,
  ObjectUpdate,
} from './types'

export interface IConsulOptionMap {
  key: string
  [name: string]: string
}

export function toConsulOptionMap(str: string): IConsulOptionMap {
  const temp = str.replace('consul!/', '')
  const parts = temp.split('?')
  const result: IConsulOptionMap = {
    key: parts[0],
  }

  if (parts.length > 1) {
    const params = parts[1]
    const options = params.split('&')
    for (const option of options) {
      const [ key, value ] = option.split('=')
      result[key] = value
    }
  }

  return result
}

export class DynamicConfig<ConfigType = any> {
  private configLoader: ConfigLoader
  private vaultClient: Promise<Maybe<VaultClient>>
  private consulClient: Maybe<KvStore>
  private consulAddress: Maybe<string>
  private consulKvDc: Maybe<string>
  private consulKeys: Maybe<string>

  private configSchema: ISchema
  private defaultConfig: ConfigType
  private envConfig: Partial<ConfigType>
  private consulConfig: Partial<ConfigType>
  private resolvedConfig: ConfigType

  constructor({
    consulAddress = process.env[CONSUL_ADDRESS],
    consulKvDc = process.env[CONSUL_KV_DC],
    consulKeys = process.env[CONSUL_KEYS],
    configPath = process.env[CONFIG_PATH],
    configEnv = process.env.NODE_ENV,
  }: IConfigOptions = {}) {
    this.consulAddress = Maybe.fromNullable(consulAddress)
    this.consulKvDc = Maybe.fromNullable(consulKvDc)
    this.consulKeys = Maybe.fromNullable(consulKeys)
    this.configLoader = new ConfigLoader({ configPath, configEnv })
  }

  /**
   * Gets a given key from the config. There are not guarantees that the config is already
   * loaded, so we must return a Promise.
   */
  public async get<T = any>(key?: string): Promise<T> {
    return this.getConfig().then((resolvedConfig: any) => {
      // If the key is not set we return the entire structure
      if (key === undefined) {
        return this.replaceConfigPlaceholders(resolvedConfig).then((resolvedValue: any) => {
          this.resolvedConfig = utils.overlayObjects(this.resolvedConfig, resolvedValue)
          this.validateConfigSchema()
          return Promise.resolve(resolvedConfig as any)
        })

      // If the key is set we try to find it in the structure
      } else {
        const value: any = utils.getValueForKey<T>(key, resolvedConfig)

        // If the value is a thing we need to resolve any placeholders
        if (value !== null) {
          return this.replaceConfigPlaceholders(value).then((resolvedValue: any) => {
            return utils.findSchemaForKey(this.configSchema, key).fork((schemaForKey: ISchema) => {
              if (utils.objectMatchesSchema(schemaForKey, resolvedValue)) {
                this.resolvedConfig = utils.setValueForKey(key, resolvedValue, this.resolvedConfig)
                return Promise.resolve(resolvedValue)
              } else {
                console.error(`Value for key '${key}' does not match expected schema`)
                return Promise.reject(new DynamicConfigInvalidObject(key))
              }
            }, () => {
              console.warn(`Unable to find schema for key: ${key}. Object may be invalid.`)
              this.resolvedConfig = utils.setValueForKey(key, resolvedValue, this.resolvedConfig)
              return Promise.resolve(resolvedValue)
            })
          })

        } else {
          console.error(`Value for key '${key}' not found in config`)
          return Promise.reject(new DynamicConfigMissingKey(key))
        }
      }
    })
  }

  /**
   * Get n number of keys from the config and return a Promise of an Array of those values.
   */
  public async getAll(...args: Array<string>): Promise<Array<any>> {
    return Promise.all(args.map((key: string) => this.get(key)))
  }

  /**
   * Looks up a key in the config. If the key cannot be found the default is returned.
   *
   * @param key The key to look up
   * @param defaultVal The value to return if the get fails
   */
  public async getWithDefault<T = any>(key: string, defaultVal: T): Promise<T> {
    return this.get(key).then((val: T) => {
      return Promise.resolve(val)
    }, (err: any) => {
      return Promise.resolve(defaultVal)
    })
  }

  /**
   * Get a value from Consul, if it is configured.
   *
   * @param consulKey Key to look up
   */
  public async getRemoteValue<T = any>(
    remoteKey: string,
  ): Promise<T> {
    return this.getConsulClient().fork((client: KvStore) => {
      const options: IConsulOptionMap = toConsulOptionMap(remoteKey)
      return client.get({ path: options.key, dc: options.dc }).then((val: any) => {
        return val
      }, (err: any) => {
        return Promise.reject(new ConsulFailed(err.message))
      })
    }, () => {
      return Promise.reject(new ConsulNotConfigured(remoteKey))
    })
  }

  /**
   * Get a value from Vault,
   * @param vaultKey Key to look up
   */
  public async getSecretValue<T = any>(
    secretKey: string,
  ): Promise<T> {
    return this.getVaultClient().then((maybeClient: Maybe<VaultClient>) => {
      return maybeClient.fork((client: VaultClient) => {
        return client.get<T>(secretKey).then((value: T) => {
          return Promise.resolve(value)
        }, (err: any) => {
          console.error(`Error retrieving key '${secretKey}' from Vault: `, err)
          return Promise.reject(new HVFailed(err.message))
        })
      }, () => {
        console.error(`Unable to get key '${secretKey}'. Vault is not configured.`)
        return Promise.reject(new HVNotConfigured(secretKey))
      })
    })
  }

  /**
   * Given a ConfigPlaceholder attempt to find the value in Vault
   */
  private async getSecretPlaceholder(value: ConfigPlaceholder): Promise<any> {
    const vaultKey: string = (
      (typeof value === 'string') ?
        value.replace('vault!/', '') :
        value.key.replace('vault!/', '')
    )

    return this.getSecretValue(vaultKey).then((secretValue: any) => {
      if (secretValue !== null) {
        return secretValue

      } else {
        console.error(`Unable to resolve secret placeholder: ${vaultKey}`)
        return Promise.reject(new MissingConfigPlaceholder(vaultKey))
      }
    }, (err: any) => {
      return Promise.reject(err)
    })
  }

  /**
   * Given a ConfigPlaceholder attempt to find the value in Consul
   */
  private async getRemotePlaceholder(value: ConfigPlaceholder): Promise<any> {
    const consulKey: string = (
      (typeof value === 'string') ?
        value.replace('consul!/', '') :
        value.key.replace('consul!/', '')
    )

    return this.getRemoteValue(consulKey).then((consulValue: any) => {
      if (consulValue === null && typeof value !== 'string' && value.default !== undefined) {
        return value.default

      } else if (consulValue !== null) {
        return consulValue

      } else {
        console.error(`Unable to resolve remote placeholder: ${consulKey}`)
        return Promise.reject(new MissingConfigPlaceholder(consulKey))
      }
    }, (err: any) => {
      if (typeof value !== 'string' && value.default !== undefined) {
        return Promise.resolve(value.default)

      } else {
        return Promise.reject(err)
      }
    })
  }

  /**
   * I personally think this is gross, a function that exists only to mutate one
   * of its arguments. Shh, it's a private function. We'll keep it a secret.
   */
  private appendUpdatesForObject(
    obj: any,
    path: Array<string>,
    updates: Array<ObjectUpdate>,
  ): void {
    if (utils.isConsulKey(obj)) {
      updates.push([ path, this.getRemotePlaceholder(obj) ])

    } else if (utils.isSecretKey(obj)) {
      updates.push([ path, this.getSecretPlaceholder(obj) ])

    } else if (typeof obj === 'object') {
      this.collectConfigPlaceholders(obj, path, updates)
    }
  }

  private collectConfigPlaceholders(
    obj: any,
    path: Array<string>,
    updates: Array<ObjectUpdate>,
  ): Array<ObjectUpdate> {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const arrValue = obj[i]
        const newPath: Array<string> = [ ...path, `${i}` ]
        this.appendUpdatesForObject(arrValue, newPath, updates)
      }

      return updates

    } else if (typeof obj === 'object') {
      for (const objKey of Object.keys(obj)) {
        const objValue = obj[objKey]
        const newPath: Array<string> = [ ...path, objKey ]
        this.appendUpdatesForObject(objValue, newPath, updates)
      }

      return updates

    } else {
      return []
    }
  }

  /**
   * When a config value is requested there is a chance that the value currently in the
   * resolved config is a placeholder, or, in the more complex case, the requested value
   * is an object that contains placeholders within nested keys. We need to find and resolve
   * any placeholders that remain in the
   */
  private async replaceConfigPlaceholders(value: any): Promise<any> {
    if (utils.isConsulKey(value)) {
      return this.getRemotePlaceholder(value)

    } else if (utils.isSecretKey(value)) {
      return this.getSecretPlaceholder(value)

    } else if (utils.isObject(value)) {
      const unresolved: Array<ObjectUpdate> = this.collectConfigPlaceholders(value, [], [])
      const paths: Array<string> = unresolved.map((next: ObjectUpdate) => next[0].join('.'))
      const promises: Array<Promise<any>> = unresolved.map((next: ObjectUpdate) => next[1])
      const resolvedPromises: Array<any> = await Promise.all(promises)
      const newObj: object = resolvedPromises.reduce((acc: object, next: any, currentIndex: number) => {
        return utils.setValueForKey(paths[currentIndex], next, acc)
      }, value)

      return utils.resolveObjectPromises(newObj)

    } else {
      return Promise.resolve(value)
    }
  }

  private async getConfig(): Promise<ConfigType> {
    if (this.resolvedConfig === undefined) {
      this.defaultConfig = await this.configLoader.loadDefault()
      this.envConfig = await this.configLoader.loadEnvironment()
      this.consulConfig = await this.getConsulConfig()
      this.resolvedConfig = await utils.overlayObjects(this.defaultConfig, this.envConfig, this.consulConfig)
      this.configSchema = utils.objectAsSimpleSchema(this.defaultConfig)
    }

    return this.resolvedConfig
  }

  private async getVaultClient(): Promise<Maybe<VaultClient>> {
    if (this.vaultClient) {
      return this.vaultClient
    } else {
      this.vaultClient = this.get<IHVConfig>(HVAULT_CONFIG_KEY).then((vaultConfig: IHVConfig) => {
        return Promise.resolve(new Just(new VaultClient(vaultConfig)))
      }, (err: any) => {
        console.log(`Unable to find valid configuration for Vault`)
        return Promise.resolve(new Nothing<VaultClient>())
      }).catch((err: any) => {
        console.error(`Error creating VaultClient: `, err)
        return Promise.reject(new Error('Unable to create VaultClient'))
      })

      return this.vaultClient
    }
  }

  private getConsulClient(): Maybe<KvStore> {
    if (this.consulClient) {
      return this.consulClient
    } else {
      if (this.consulAddress.isNothing()) {
        console.warn('Could not create a Consul client: Consul Address (CONSUL_ADDRESS) is not defined')
        this.consulClient = new Nothing<KvStore>()
      } else if (this.consulKvDc.isNothing()) {
        console.warn('Could not create a Consul client: Consul Data Centre (CONSUL_KV_DC) is not defined')
        this.consulClient = new Nothing<KvStore>()
      } else {
        this.consulClient = new Just(new KvStore(this.consulAddress.get()))
      }

      return this.consulClient
    }
  }

  private async getConsulConfig(): Promise<any> {
    return Maybe.all(
      this.consulKeys,
      this.getConsulClient(),
      this.consulKvDc,
    ).fork(([ keys, client, dc ]) => {
      const rawConfigs: Promise<Array<any>> =
        Promise.all(keys.split(',').map((key: string) => {
          return client.get({ path: key, dc })
        }))

      const resolvedConfigs: Promise<any> =
        rawConfigs.then((configs: Array<any>): any => {
          return (utils.overlayObjects(...configs) as any)
        })

      return resolvedConfigs
    }, () => {
      return Promise.resolve({})
    })
  }

  /**
   * Just a warning for when the config schema changes. Eventually we'll probably raise an error for this. When
   * I'm more confident in the validation.
   */
  private validateConfigSchema(): void {
    if (!utils.objectMatchesSchema(this.configSchema, this.resolvedConfig)) {
      console.warn('The shape of the config changed during resolution. This may indicate an error.')
    }
  }
}
