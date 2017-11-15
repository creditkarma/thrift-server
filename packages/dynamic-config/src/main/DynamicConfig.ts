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
  CONSUL_ADDRESS,
  CONSUL_KEYS,
  CONSUL_KV_DC,
  HVAULT_CONFIG_KEY,
} from './constants'

import {
  resolveConfigs,
} from './resolve'

import {
  Just,
  Maybe,
  Nothing,
} from './Maybe'

import {
  getValueForKey,
} from './utils'

export interface IConfigOptions {
  consulAddress?: string
  consulKvDc?: string
  consulKeys?: string
  configPath?: string
  configEnv?: string
}

export class DynamicConfigMissingKey extends Error {
  constructor(key: string) {
    super(`Unable to retrieve value for key: ${key}`)
  }
}

export class HVNotConfigured extends Error {
  constructor() {
    super(`Hashicorp Vault is not configured`)
  }
}

export class HVFailed extends Error {
  constructor(message?: string) {
    super(message)
  }
}

export class DynamicConfig {
  private configLoader: ConfigLoader
  private vaultClient: Maybe<VaultClient>
  private consulClient: Maybe<KvStore>
  private consulAddress: Maybe<string>
  private consulKvDc: Maybe<string>
  private consulKeys: Maybe<string>

  constructor(options: IConfigOptions = {}) {
    this.consulAddress = Maybe.fromNullable(options.consulAddress || process.env[CONSUL_ADDRESS])
    this.consulKvDc = Maybe.fromNullable(options.consulKvDc || process.env[CONSUL_KV_DC])
    this.consulKeys = Maybe.fromNullable(options.consulKeys || process.env[CONSUL_KEYS])
    this.configLoader = new ConfigLoader({ configPath: options.configPath, configEnv: options.configEnv })
  }

  public async get<T = any>(rootKey: string = ''): Promise<T> {
    const localConfig: any = await this.configLoader.resolve()
    const consulConfig: any = await this.getConsulConfig()
    const resolvedConfig: any = resolveConfigs(localConfig, consulConfig)

    // If the rootKey is not set we return the entire structure
    if (rootKey === '') {
      return Promise.resolve(resolvedConfig)

    // If the rootKey is set we try to find it in the structure
    } else {
      const value: T | null = getValueForKey<T>(rootKey, resolvedConfig)
      if (value !== null) {
        return Promise.resolve(value)
      } else {
        return Promise.reject(new DynamicConfigMissingKey(rootKey))
      }
    }
  }

  public async getSecretValue<T = any>(
    vaultKey: string,
    hVaultClient: Promise<Maybe<VaultClient>> = this.getHVaultClient(),
  ): Promise<T> {
    const maybeClient = await hVaultClient
    return maybeClient.fork((client: VaultClient) => {
      return client.get<T>(vaultKey).then((value: T) => {
        return Promise.resolve(value)
      }, (err: any) => {
        return Promise.reject(new HVFailed(err.message))
      })
    }, () => {
      return Promise.reject(new HVNotConfigured())
    })
  }

  public async getHVaultClient(): Promise<Maybe<VaultClient>> {
    if (this.vaultClient) {
      return Promise.resolve(this.vaultClient)
    } else {
      return this.get<IHVConfig>(HVAULT_CONFIG_KEY).then((vaultConfig: IHVConfig) => {
        this.vaultClient = new Just(new VaultClient(vaultConfig))
        return Promise.resolve(this.vaultClient)
      }, (err: any) => {
        this.vaultClient = new Nothing()
        return Promise.resolve(this.vaultClient)
      }).catch((err: any) => {
        console.error(`Error creating VaultClient: `, err)
        return Promise.reject(new Error('Unable to create VaultClient'))
      })
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

  private getConsulConfig<T = any>(
    consulKeys: Maybe<string> = this.consulKeys,
    consulKvDc: Maybe<string> = this.consulKvDc,
    consulClient: Maybe<KvStore> = this.getConsulClient(),
  ): Promise<T> {
    return Maybe.all(consulKeys, consulClient, consulKvDc).fork(([ keys, client, dc ]) => {
      const rawConfigs: Promise<Array<any>> =
        Promise.all(keys.split(',').map((key: string) => {
          return client.get({ path: key, dc })
        }))

      const resolvedConfig: Promise<any> =
        rawConfigs.then((configs: Array<any>) => {
          return (resolveConfigs(...configs) as T)
        })

      return resolvedConfig
    }, () => {
      return Promise.resolve({})
    })
  }
}
