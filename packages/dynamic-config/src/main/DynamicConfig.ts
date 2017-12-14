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
  DynamicConfigMissingKey,
  HVFailed,
  HVNotConfigured,
} from './errors'

import {
  IConfigOptions,
  ISchema,
} from './types'

interface IConsulOptionMap {
  key: string
  [name: string]: string
}

function toConsulOptionMap(str: string): IConsulOptionMap {
  const temp = str.replace('!consul/', '')
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
    this.consulClient = this.getConsulClient()
    this.vaultClient = this.getVaultClient()
  }

  public async get<T = any>(key: string = ''): Promise<T> {
    console.log('get: ', key)
    return this.getConfig().then((resolvedConfig: any) => {
      // If the key is not set we return the entire structure
      if (key === '') {
        return Promise.resolve(resolvedConfig as any)

      // If the key is set we try to find it in the structure
      } else {
        const value: any = utils.getValueForKey<T>(key, resolvedConfig)

        if (value !== null) {
          if (utils.isConsulKey(value)) {
            const consulKey: string = (
              (typeof value === 'string') ?
                value.replace('consul!/', '') :
                value.key.replace('consul!/', '')
            )

            return this.getConsulValue(consulKey).then((consulValue: any) => {
              if (consulValue === null && typeof value !== 'string' && value.default !== undefined) {
                return value.default
              } else if (consulValue !== null) {
                this.resolvedConfig = utils.setValueForKey(key, consulValue, this.resolvedConfig)
                this.validateConfigSchema()
                return consulValue
              } else {
                return Promise.reject(new DynamicConfigMissingKey(key))
              }
            }, (err: any) => {
              return Promise.reject(err)
            })

          } else if (utils.isSecretKey(value)) {
            const vaultKey: string =
              (typeof value === 'string') ? value : value.key

            return this.getSecretValue(vaultKey).then((secretValue: any) => {
              if (secretValue !== null) {
                this.resolvedConfig = utils.setValueForKey(key, secretValue, this.resolvedConfig)
                this.validateConfigSchema()
                return secretValue
              } else {
                return Promise.reject(new DynamicConfigMissingKey(key))
              }
            }, (err: any) => {
              return Promise.reject(err)
            })

          } else {
            return Promise.resolve(value)
          }

        } else {
          console.error(`Value for key (${key}) not found in config`)
          return Promise.reject(new DynamicConfigMissingKey(key))
        }
      }
    })
  }

  public async getConsulValue<T = any>(
    consulKey: string,
  ): Promise<T> {
    const options: IConsulOptionMap = toConsulOptionMap(consulKey)
    return this.consulClient.fork((client: KvStore) => {
      return client.get({ path: options.key, dc: options.dc }).then((val: any) => {
        return val
      }, (err: any) => {
        return Promise.reject(new ConsulFailed(err.message))
      })
    }, () => {
      return Promise.reject(new ConsulNotConfigured(consulKey))
    })
  }

  public async getSecretValue<T = any>(
    vaultKey: string,
  ): Promise<T> {
    const maybeClient = await this.vaultClient
    return maybeClient.fork((client: VaultClient) => {
      return client.get<T>(vaultKey).then((value: T) => {
        return Promise.resolve(value)
      }, (err: any) => {
        console.error(`Error retrieving key (${vaultKey}) from Vault: `, err)
        return Promise.reject(new HVFailed(err.message))
      })
    }, () => {
      console.error(`Unable to get ${vaultKey}. Vault is not configured.`)
      return Promise.reject(new HVNotConfigured(vaultKey))
    })
  }

  private async getConfig(): Promise<ConfigType> {
    if (this.resolvedConfig === undefined) {
      this.defaultConfig = await this.configLoader.loadDefault()
      this.envConfig = await this.configLoader.loadEnvironment()
      this.consulConfig = await this.getConsulConfig()
      this.resolvedConfig = await utils.overlayObjects(this.defaultConfig, this.envConfig, this.consulConfig)
      this.configSchema = utils.objectAsSimpleSchema(this.defaultConfig)

      this.validateConfigSchema()
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
        console.log(`Vault is not configured`)
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

  private async getConsulConfig(
    consulKeys: Maybe<string> = this.consulKeys,
    consulKvDc: Maybe<string> = this.consulKvDc,
    consulClient: Maybe<KvStore> = this.consulClient,
  ): Promise<any> {
    return Maybe.all(consulKeys, consulClient, consulKvDc).fork(([ keys, client, dc ]) => {
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

  private validateConfigSchema(): void {
    if (!utils.objectMatchesSchema(this.configSchema, this.resolvedConfig)) {
      console.warn('The shape of the config changed during resolution. This may indicate an error.')
    }
  }
}
