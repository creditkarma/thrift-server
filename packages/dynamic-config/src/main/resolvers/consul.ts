import {
  KvStore,
} from '@creditkarma/consul-client'

import { DynamicConfig } from '../DynamicConfig'
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
  IRemoteResolver,
} from '../types'

import {
  ObjectUtils,
} from '../utils'

export function toRemoteOptionMap(str: string, remoteName: string): IRemoteOverrides {
  const temp = str.replace(`${remoteName}!/`, '')
  const [ key, ...tail ] = temp.split('?')
  const result: IRemoteOverrides = { key }

  if (tail.length > 0) {
    const params = tail[0]
    const options = params.split('&')
    for (const option of options) {
      const [ name, value ] = option.split('=')
      result[name] = value
    }
  }

  return result
}

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
            return (ObjectUtils.overlayObjects(...configs) as any)
          })

        return resolvedConfigs
      }, () => {
        return Promise.resolve({})
      })
    },

    get<T = any>(key: string): Promise<T> {
      return getConsulClient().fork((client: KvStore) => {
        const remoteOptions: IRemoteOverrides = toRemoteOptionMap(key, 'consul')
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
