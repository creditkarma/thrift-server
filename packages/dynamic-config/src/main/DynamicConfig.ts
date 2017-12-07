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

import {
  DynamicConfigMissingKey,
  HVFailed,
  HVNotConfigured,
} from './errors'

import {
  IConfigOptions,
} from './types'

export function getConsulClient(consulAddress: Maybe<string>, consulKvDc: Maybe<string>): Maybe<KvStore> {
  if (consulAddress.isNothing()) {
    console.warn('Could not create a Consul client: Consul Address (CONSUL_ADDRESS) is not defined')
    return new Nothing<KvStore>()
  } else if (consulKvDc.isNothing()) {
    console.warn('Could not create a Consul client: Consul Data Centre (CONSUL_KV_DC) is not defined')
    return new Nothing<KvStore>()
  } else {
    return new Just(new KvStore(consulAddress.get()))
  }
}

export function getConsulConfig(
  consulKeys: Maybe<string>,
  consulKvDc: Maybe<string>,
  consulClient: Maybe<KvStore>,
): Promise<any> {
  return Maybe.all(consulKeys, consulClient, consulKvDc).fork(([ keys, client, dc ]) => {
    const rawConfigs: Promise<Array<any>> =
      Promise.all(keys.split(',').map((key: string) => {
        return client.get({ path: key, dc })
      }))

    const resolvedConfigs: Promise<any> =
      rawConfigs.then((configs: Array<any>): any => {
        return (resolveConfigs(...configs) as any)
      })

    return resolvedConfigs
  }, () => {
    return Promise.resolve({})
  })
}

export class DynamicConfig<ConfigType = any> {
  private configLoader: ConfigLoader
  private vaultClient: Maybe<VaultClient>
  private consulClient: Maybe<KvStore>
  private consulAddress: Maybe<string>
  private consulKvDc: Maybe<string>
  private consulKeys: Maybe<string>
  private configValue: ConfigType
  private consulConfig: Partial<ConfigType>
  private localConfig: ConfigType

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

  public async get<T = any>(key: string = ''): Promise<T> {
    const resolvedConfig: any = await this.getConfig()

    // If the key is not set we return the entire structure
    if (key === '') {
      return Promise.resolve(resolvedConfig)

    // If the key is set we try to find it in the structure
    } else {
      const value: T | null = getValueForKey<T>(key, resolvedConfig)
      if (value !== null) {
        return Promise.resolve(value)
      } else {
        console.error(`Value for key (${key}) not found in config`)
        return Promise.reject(new DynamicConfigMissingKey(key))
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

  protected async getConfig(): Promise<ConfigType> {
    if (this.configValue === undefined) {
      const localConfig: any = await this.getLocalConfig()
      const consulConfig: any = await this.getConsulConfig()
      this.configValue = await resolveConfigs(localConfig, consulConfig)
    }

    return this.configValue
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
      this.consulClient = getConsulClient(this.consulAddress, this.consulKvDc)
      return this.consulClient
    }
  }

  private async getConsulConfig(
    consulKeys: Maybe<string> = this.consulKeys,
    consulKvDc: Maybe<string> = this.consulKvDc,
    consulClient: Maybe<KvStore> = this.getConsulClient(),
  ): Promise<any> {
    if (this.consulConfig !== undefined) {
      return Promise.resolve(this.consulConfig)
    } else {
      this.consulConfig = await getConsulConfig(consulKeys, consulKvDc, consulClient)
      return this.consulConfig
    }
  }

  private async getLocalConfig(): Promise<ConfigType> {
    if (this.localConfig) {
      return Promise.resolve(this.localConfig)
    } else {
      this.localConfig = await this.configLoader.resolve()
      return this.localConfig
    }
  }
}
