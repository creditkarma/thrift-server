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
        console.error(`Value for key (${rootKey}) not found in config`)
        return Promise.reject(new DynamicConfigMissingKey(rootKey))
      }
    }
  }

  public async getSecretValue<T = any>(
    vaultKey: string,
    vaultClient: Promise<Maybe<VaultClient>> = this.getHVaultClient(),
  ): Promise<T> {
    const maybeClient = await vaultClient
    return maybeClient.fork((client: VaultClient) => {
      return client.get<T>(vaultKey).then((value: T) => {
        return Promise.resolve(value)
      }, (err: any) => {
        console.error(`Error retrieving key (${vaultKey}) from Vault: `, err)
        return Promise.reject(new HVFailed(err.message))
      })
    }, () => {
      console.error(`Unable to get ${vaultKey}. Vault is not configured.`)
      return Promise.reject(new HVNotConfigured())
    })
  }

  private async getHVaultClient(): Promise<Maybe<VaultClient>> {
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

  private async getConsulConfig<T = any>(
    consulKeys: Maybe<string> = this.consulKeys,
    consulKvDc: Maybe<string> = this.consulKvDc,
    consulClient: Maybe<KvStore> = this.getConsulClient(),
  ): Promise<T> {
    return Maybe.all(consulKeys, consulClient, consulKvDc).fork(([ keys, client, dc ]) => {
      const rawConfigs: Promise<Array<any>> =
        Promise.all(keys.split(',').map((key: string) => {
          return client.get({ path: key, dc })
        }))

      const resolvedConfig: Promise<T> =
        rawConfigs.then((configs: Array<any>): T => {
          return (resolveConfigs(...configs) as T)
        })

      return resolvedConfig
    }, () => {
      return Promise.resolve({} as T)
    })
  }
}
