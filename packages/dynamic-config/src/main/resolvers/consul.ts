import {
  KvStore,
} from '@creditkarma/consul-client'

import { DynamicConfig, IRemoteResolver } from '../DynamicConfig'
import { Just, Maybe, Nothing } from '../Maybe'

import {
  CONSUL_ADDRESS,
  CONSUL_KEYS,
  CONSUL_KV_DC,
} from '../constants'

import {
  ConsulFailed,
  ConsulNotConfigured,
} from '../errors'

import {
  IConsulOptions,
  IRemoteOverrides,
} from '../types'

import * as utils from '../utils'

export function defaultConsulResolver(): IRemoteResolver {
  let consulClient: Maybe<KvStore>
  let consulAddress: Maybe<string> = new Nothing()
  let consulKvDc: Maybe<string> = new Nothing()
  let consulKeys: Maybe<string> = new Nothing()

  function getConsulClient(): Maybe<KvStore> {
    if (consulClient !== undefined) {
      return consulClient
    } else {
      if (consulAddress.isNothing()) {
        console.warn('Could not create a Consul client: Consul Address (CONSUL_ADDRESS) is not defined')
        consulClient = new Nothing<KvStore>()
      } else if (consulKvDc.isNothing()) {
        console.warn('Could not create a Consul client: Consul Data Centre (CONSUL_KV_DC) is not defined')
        consulClient = new Nothing<KvStore>()
      } else {
        consulClient = new Just(new KvStore(consulAddress.get()))
      }

      return consulClient
    }
  }

  return {
    type: 'remote',
    name: 'consul',
    init(configInstance: DynamicConfig, remoteOptions: IConsulOptions = {}): Promise<any> {
      consulAddress = Maybe.fromNullable(remoteOptions.consulAddress || process.env[CONSUL_ADDRESS])
      consulKvDc = Maybe.fromNullable(remoteOptions.consulKvDc || process.env[CONSUL_KV_DC])
      consulKeys = Maybe.fromNullable(remoteOptions.consulKeys || process.env[CONSUL_KEYS])

      return Maybe.all(
        consulKeys,
        getConsulClient(),
        consulKvDc,
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
    },

    get<T = any>(key: string): Promise<T> {
      return getConsulClient().fork((client: KvStore) => {
        const remoteOptions: IRemoteOverrides = utils.toRemoteOptionMap(key, 'consul')
        return client.get({ path: remoteOptions.key, dc: remoteOptions.dc }).then((val: any) => {
          return val
        }, (err: any) => {
          console.error(`Error retrieving key '${key}' from Consul: `, err)
          return Promise.reject(new ConsulFailed(err.message))
        })
      }, () => {
        return Promise.reject(new ConsulNotConfigured(key))
      })
    },
  }
}
