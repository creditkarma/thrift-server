import {
    ConfigLoader,
} from './ConfigLoader'

import {
    CONFIG_ENV,
    CONFIG_PATH,
} from './constants'

import {
    ConfigBuilder,
    ConfigPromises,
    ConfigUtils,
    ObjectUtils,
    PromiseUtils,
    SchemaUtils,
    Utils,
} from './utils'

import {
    DynamicConfigInvalidObject,
    DynamicConfigMissingKey,
    MissingConfigPlaceholder,
    ResolverUnavailable,
} from './errors'

import {
    BaseConfigValue,
    ConfigResolver,
    ConfigValue,
    IConfigOptions,
    IDynamicConfig,
    IRemoteOptions,
    IResolvedPlaceholder,
    IResolverMap,
    IRootConfigValue,
    ISchema,
    PromisedUpdate,
    ResolverType,
} from './types'

import * as logger from './logger'

type ConfigState =
    'startup' | 'init' | 'running'

export class DynamicConfig implements IDynamicConfig {
    private configState: ConfigState
    private configLoader: ConfigLoader
    private remoteOptions: IRemoteOptions

    private configSchema: ISchema
    private resolvedConfig: IRootConfigValue

    private resolvers: IResolverMap

    constructor({
        configPath = Utils.readFromEnvOrProcess(CONFIG_PATH),
        configEnv = Utils.readFirstMatch(CONFIG_ENV, 'NODE_ENV'),
        remoteOptions = {},
        resolvers = [],
        loaders = [],
    }: IConfigOptions = {}) {
        this.configState = 'startup'
        this.configSchema = {
            type: 'object',
            properties: {},
            required: [],
        }
        this.resolvedConfig = {
            type: 'root',
            properties: {},
        }
        this.configLoader = new ConfigLoader({ loaders, configPath, configEnv })
        this.remoteOptions = remoteOptions
        this.resolvers = {
            names: new Set<string>(),
            all: new Map(),
        }
        this.register(...resolvers)
    }

    public register(...resolvers: Array<ConfigResolver>): void {
        if (this.configState === 'startup') {
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

        return this.getConfig().then((resolvedConfig: IRootConfigValue) => {
            // If the key is not set we return the entire structure
            if (key === undefined) {
                return this.replaceConfigPlaceholders(resolvedConfig).then(
                    (resolvedValue: IRootConfigValue): Promise<IRootConfigValue> => {
                        this.resolvedConfig = ObjectUtils.overlayObjects(this.resolvedConfig, resolvedValue)
                        this.validateConfigSchema()
                        return Promise.resolve(
                            ConfigUtils.readConfigValue(this.resolvedConfig),
                        )
                    },
                )

            // If the key is set we try to find it in the structure
            } else {
                const value: ConfigValue | null = ConfigUtils.getConfigForKey(key, resolvedConfig)

                // If the value is a thing we need to resolve any placeholders
                if (value !== null) {
                    return this.replaceConfigPlaceholders(value).then((resolvedValue: BaseConfigValue) => {
                        const baseValue = ConfigUtils.readConfigValue(resolvedValue)

                        return SchemaUtils.findSchemaForKey(this.configSchema, key).fork((schemaForKey: ISchema) => {
                            if (SchemaUtils.objectMatchesSchema(schemaForKey, baseValue)) {
                                this.resolvedConfig = ConfigUtils.setRootConfigValueForKey(key, resolvedValue, this.resolvedConfig)
                                return Promise.resolve(baseValue)
                            } else {
                                logger.error(`Value for key[${key}] from remote[${resolvedValue}] does not match expected schema`)
                                return Promise.reject(new DynamicConfigInvalidObject(key))
                            }
                        }, () => {
                            logger.warn(`Unable to find schema for key[${key}]. Object may be invalid.`)
                            this.resolvedConfig = ConfigUtils.setRootConfigValueForKey(key, resolvedValue, this.resolvedConfig)
                            return Promise.resolve(baseValue)
                        })
                    })

                } else {
                    logger.error(`Value for key[${key}] not found in config`)
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
        return this.getRemoteValue(placeholder.key).then((remoteValue: any) => {
            return Promise.resolve(remoteValue)
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
        switch (placeholder.resolver.type) {
            case 'remote':
                return this.getRemotePlaceholder(placeholder)

            case 'secret':
                return this.getSecretPlaceholder(placeholder)

            default:
                return Promise.reject(new Error(`Unrecognized placeholder type[${placeholder.resolver.type}]`))
        }
    }

    /**
     * I personally think this is gross, a function that exists only to mutate one
     * of its arguments. Shh, it's a private function. We'll keep it a secret.
     */
    private appendUpdatesForObject(
        configValue: ConfigValue,
        path: Array<string>,
        updates: Array<PromisedUpdate>,
    ): void {
        if (configValue.type === 'placeholder') {
            const resolvedPlaceholder: IResolvedPlaceholder =
                ConfigUtils.normalizeConfigPlaceholder(configValue.value, this.resolvers)

            updates.push([ path, this.resolvePlaceholder(resolvedPlaceholder).then((value: any) => {
                return ConfigBuilder.buildBaseConfigValue(
                    resolvedPlaceholder.resolver.name,
                    resolvedPlaceholder.resolver.type,
                    value,
                )
            }) ])

        } else if (configValue.type === 'object') {
            this.collectConfigPlaceholders(configValue, path, updates)
        }
    }

    private collectConfigPlaceholders(
        configValue: ConfigValue,
        path: Array<string>,
        updates: Array<PromisedUpdate>,
    ): Array<PromisedUpdate> {
        if (configValue.type === 'object' || configValue.type === 'root') {
            for (const key of Object.keys(configValue.properties)) {
                const objValue: BaseConfigValue = configValue.properties[key]
                const newPath: Array<string> = [ ...path, key ]
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
     * any placeholders that remain in the config
     */
    private async replaceConfigPlaceholders(configValue: ConfigValue): Promise<ConfigValue> {
        if (configValue.type === 'placeholder') {
            const resolvedPlaceholder: IResolvedPlaceholder =
                ConfigUtils.normalizeConfigPlaceholder(configValue.value, this.resolvers)

            return this.resolvePlaceholder(resolvedPlaceholder).then((value: any) => {
                return ConfigBuilder.buildBaseConfigValue(
                    resolvedPlaceholder.resolver.name,
                    resolvedPlaceholder.resolver.type,
                    value,
                )
            })

        } else if (configValue.type === 'object' || configValue.type === 'root') {
            const unresolved: Array<PromisedUpdate> = this.collectConfigPlaceholders(configValue, [], [])
            const paths: Array<string> = unresolved.map((next: PromisedUpdate) => next[0].join('.'))
            const promises: Array<Promise<BaseConfigValue>> = unresolved.map((next: PromisedUpdate) => next[1])
            const resolvedPromises: Array<BaseConfigValue> = await Promise.all(promises)
            const newObj: ConfigValue = resolvedPromises.reduce((acc: ConfigValue, next: BaseConfigValue, currentIndex: number) => {
                return ConfigUtils.setValueForKey(paths[currentIndex], next, acc)
            }, configValue)

            return ConfigPromises.resolveConfigPromises(newObj)

        } else {
            return Promise.resolve(configValue)
        }
    }

    private async getConfig(): Promise<IRootConfigValue> {
        if (Object.keys(this.resolvedConfig.properties).length === 0) {
            this.configState = 'init'
            const defaultConfig: IRootConfigValue = await this.configLoader.loadDefault()
            const envConfig: IRootConfigValue = await this.configLoader.loadEnvironment()
            const remoteConfigs: Array<IRootConfigValue> = await this.initializeResolvers()
            this.resolvedConfig = await ObjectUtils.overlayObjects(defaultConfig, envConfig, ...remoteConfigs)
            this.configSchema = SchemaUtils.objectAsSimpleSchema(defaultConfig)
        }

        return this.resolvedConfig
    }

    /**
     * Just a warning for when the config schema changes. Eventually we'll probably raise an error for this. When
     * I'm more confident in the validation.
     */
    private validateConfigSchema(): void {
        if (!SchemaUtils.objectMatchesSchema(this.configSchema, this.resolvedConfig)) {
            logger.warn('The shape of the config changed during resolution. This may indicate an error.')
        }
    }

    private initializeResolvers(): Promise<Array<IRootConfigValue>> {
        return Promise.all([ ...this.resolvers.all.values() ].map((next: ConfigResolver) => {
            return next.init(this, this.remoteOptions[next.name]).then((config: any) => {
                return ConfigBuilder.createConfigObject(next.name, next.type, config)
            })
        }))
    }

    private getValueFromResolver<T>(key: string, type: ResolverType): Promise <T> {
        const resolvers = [ ...this.resolvers.all.values() ].filter((next: ConfigResolver) => {
            return next.type === type
        })

        if (resolvers.length > 0) {
            return PromiseUtils.race(resolvers.map((next: ConfigResolver) => {
                return next.get<T>(key)
            })).then((remoteValue: T) => {
                if (remoteValue !== null) {
                    return Promise.resolve(remoteValue)

                } else {
                    logger.error(`Unable to resolve remote value for key[${key}]`)
                    return Promise.reject(new DynamicConfigMissingKey(key))
                }
            }, (err: any) => {
                logger.error(`Unable to resolve remote value for key[${key}]`)
                return Promise.reject(new DynamicConfigMissingKey(key))
            })
        } else {
            logger.error(`There are no remote resolvers for key[${key}]`)
            return Promise.reject(new ResolverUnavailable(key))
        }
    }
}
