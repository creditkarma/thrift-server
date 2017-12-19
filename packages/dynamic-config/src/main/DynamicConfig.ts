import {
  ConfigLoader,
} from './ConfigLoader'

import {
  CONFIG_PATH,
} from './constants'

import * as utils from './utils'

import {
  DynamicConfigInvalidObject,
  DynamicConfigMissingKey,
  MissingConfigPlaceholder,
  ResolverUnavailable,
} from './errors'

import {
  ConfigPlaceholder,
  IConfigOptions,
  IRemoteOptions,
  IResolvedPlaceholder,
  ISchema,
  ObjectUpdate,
  ResolverType,
} from './types'

export interface IResolverMap {
  names: Set<string>
  all: Map<string, ConfigResolver>
}

export type ConfigResolver =
  IRemoteResolver | ISecretResolver

export type IRemoteInitializer = (dynamicConfig: DynamicConfig, remoteOptions?: IRemoteOptions) => Promise<any>

export interface IRemoteResolver {
  type: 'remote'
  name: string
  init: IRemoteInitializer
  get<T>(key: string): Promise<T>
}

export type IInitMethod<T extends object> = (dynamicConfig: DynamicConfig, remoteOptions?: IRemoteOptions) => Promise<T>

export interface ISecretResolver {
  type: 'secret'
  name: string
  init: IRemoteInitializer
  get<T>(key: string): Promise<T>
}

function normalizeConfigPlaceholder(
  placeholder: ConfigPlaceholder,
  resolvers: IResolverMap,
): IResolvedPlaceholder {
  if (typeof placeholder === 'string') {
    const [ name, key ] = placeholder.split('!/')
    const resolver = resolvers.all.get(name)
    if (resolver !== undefined) {
      return {
        key,
        name,
        type: resolver.type,
      }
    }

  } else {
    const [ name, key ]: Array<string> = placeholder.key.split('!/')
    const resolver = resolvers.all.get(name)
    if (resolver !== undefined) {
      return {
        key,
        name,
        type: resolver.type,
        default: placeholder.default,
      }
    }
  }

  throw new Error(`No resolver found for remote: ${name}`)
}

type ConfigState =
  'startup' | 'init' | 'running'

export class DynamicConfig<ConfigType = any> {
  private configState: ConfigState
  private configLoader: ConfigLoader
  private remoteOptions: IRemoteOptions

  private configSchema: ISchema
  private resolvedConfig: ConfigType

  private resolvers: IResolverMap

  constructor({
    configPath = process.env[CONFIG_PATH],
    configEnv = process.env.NODE_ENV,
    remoteOptions = {},
  }: IConfigOptions = {}) {
    this.configState = 'startup'
    this.configLoader = new ConfigLoader({ configPath, configEnv })
    this.remoteOptions = remoteOptions
    this.resolvers = {
      names: new Set<string>(),
      all: new Map(),
    }
  }

  public register(...resolvers: Array<ConfigResolver>): void {
    if (this.configState !== 'running') {
      resolvers.forEach((resolver: ConfigResolver) => {
        this.resolvers.names.add(resolver.name)
        this.resolvers.all.set(resolver.name, resolver)
      })
    } else {
      throw new Error(`Resolvers cannot be registered once requests have been made`)
    }
  }

  /**
   * Gets a given key from the config. There are not guarantees that the config is already
   * loaded, so we must return a Promise.
   */
  public async get<T = any>(key?: string): Promise<T> {
    this.configState = 'running'
    return this.getConfig().then((resolvedConfig: any) => {

      // If the key is not set we return the entire structure
      if (key === undefined) {
        return this.replaceConfigPlaceholders(resolvedConfig).then((resolvedValue: any) => {
          this.resolvedConfig = utils.overlayObjects(this.resolvedConfig, resolvedValue)
          this.validateConfigSchema()
          return Promise.resolve(this.resolvedConfig as any)
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

  public async getRemoteValue<T>(key: string): Promise<T> {
    return this.getValueFromResolver<T>(key, 'remote')
  }

  public async getSecretValue<T>(key: string): Promise<T> {
    return this.getValueFromResolver<T>(key, 'secret')
  }

  /**
   * Given a ConfigPlaceholder attempt to find the value in Vault
   */
  private async getSecretPlaceholder(placeholder: IResolvedPlaceholder): Promise<any> {
    return this.getSecretValue(placeholder.key).catch((err: any) => {
      if (err instanceof DynamicConfigMissingKey) {
        return Promise.reject(new MissingConfigPlaceholder(placeholder.key))
      } else {
        return Promise.reject(err)
      }
    })
  }

  /**
   * Given a ConfigPlaceholder attempt to find the value in Consul
   */
  private async getRemotePlaceholder(placeholder: IResolvedPlaceholder): Promise<any> {
    return this.getRemoteValue(placeholder.key).then((consulValue: any) => {
      return Promise.resolve(consulValue)
    }, (err: any) => {
      if (placeholder.default !== undefined) {
        return Promise.resolve(placeholder.default)

      } else if (err instanceof DynamicConfigMissingKey) {
        return Promise.reject(new MissingConfigPlaceholder(placeholder.key))

      } else {
        return Promise.reject(err)
      }
    })
  }

  private resolvePlaceholder(placeholder: IResolvedPlaceholder): Promise<any> {
    switch (placeholder.type) {
      case 'remote':
        return this.getRemotePlaceholder(placeholder)

      case 'secret':
        return this.getSecretPlaceholder(placeholder)
    }
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
    if (utils.isConfigPlaceholder(obj, this.resolvers.names)) {
      const resolvedPlaceholder: IResolvedPlaceholder = normalizeConfigPlaceholder(obj, this.resolvers)
      updates.push([ path, this.resolvePlaceholder(resolvedPlaceholder) ])

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
    if (utils.isConfigPlaceholder(value, this.resolvers.names)) {
      const resolvedPlaceholder: IResolvedPlaceholder = normalizeConfigPlaceholder(value, this.resolvers)
      return this.resolvePlaceholder(resolvedPlaceholder)

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
      this.configState = 'init'
      const defaultConfig = await this.configLoader.loadDefault()
      const envConfig = await this.configLoader.loadEnvironment()
      const remoteConfigs: Array<any> = await this.initializeResolvers()
      this.resolvedConfig = await utils.overlayObjects(defaultConfig, envConfig, ...remoteConfigs)
      this.configSchema = utils.objectAsSimpleSchema(defaultConfig)
    }

    return this.resolvedConfig
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

  private initializeResolvers(): Promise<Array<any>> {
    return Promise.all([ ...this.resolvers.all.values() ].map((next: ConfigResolver) => {
      return next.init(this, this.remoteOptions[next.name])
    }))
  }

  private getValueFromResolver<T>(key: string, type: ResolverType): Promise<T> {
    const resolvers = [ ...this.resolvers.all.values() ].filter((next: ConfigResolver) => {
      return next.type === type
    })

    if (resolvers.length > 0) {
      return utils.race(resolvers.map((next: ConfigResolver) => {
        return next.get<T>(key)
      })).then((remoteValue: T) => {
        if (remoteValue !== null) {
          return Promise.resolve(remoteValue)

        } else {
          console.error(`Unable to resolve remote value: ${key}`)
          return Promise.reject(new DynamicConfigMissingKey(key))
        }
      }, (err: any) => {
        console.error(`Unable to resolve remote value: ${key}`)
        return Promise.reject(new DynamicConfigMissingKey(key))
      })
    } else {
      return Promise.reject(new ResolverUnavailable(key))
    }
  }
}
