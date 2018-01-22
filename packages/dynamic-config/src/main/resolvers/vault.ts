import {
  IHVConfig,
  VaultClient,
} from '@creditkarma/vault-client'

import {
  HVAULT_CONFIG_KEY,
} from '../constants'

import { DynamicConfig } from '../DynamicConfig'
import { Just, Maybe, Nothing } from '../Maybe'

import {
  HVFailed,
  HVNotConfigured,
} from '../errors'

import {
  ISecretResolver,
} from '../types'

import * as logger from '../logger'

export function vaultResolver(): ISecretResolver {
  let vaultClient: Promise<Maybe<VaultClient>>
  let dynamicConfig: DynamicConfig

  async function getVaultClient(): Promise<Maybe<VaultClient>> {
    if (vaultClient !== undefined) {
      return vaultClient
    } else {
      vaultClient = dynamicConfig.get<IHVConfig>(HVAULT_CONFIG_KEY).then((vaultConfig: IHVConfig) => {
        return Promise.resolve(new Just(new VaultClient(vaultConfig)))
      }, (err: any) => {
        logger.log(`Unable to find valid configuration for Vault`)
        return Promise.resolve(new Nothing<VaultClient>())
      }).catch((err: any) => {
        logger.error(`Error creating VaultClient: `, err)
        return Promise.reject(new Error('Unable to create VaultClient'))
      })

      return vaultClient
    }
  }

  return {
    type: 'secret',
    name: 'vault',
    init(configInstance: DynamicConfig): Promise<any> {
      dynamicConfig = configInstance
      return Promise.resolve({})
    },
    get<T>(key: string): Promise<T> {
      return getVaultClient().then((maybeClient: Maybe<VaultClient>) => {
        return maybeClient.fork((client: VaultClient) => {
          return client.get<T>(key).then((value: T) => {
            return Promise.resolve(value)
          }, (err: any) => {
            logger.error(`Error retrieving key '${key}' from Vault: `, err)
            return Promise.reject(new HVFailed(err.message))
          })
        }, () => {
          logger.error(`Unable to get key '${key}'. Vault is not configured.`)
          return Promise.reject(new HVNotConfigured(key))
        })
      })
    },
  }
}
