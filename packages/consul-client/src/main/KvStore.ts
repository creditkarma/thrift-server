import { CoreOptions, RequestResponse } from 'request'

import { ConsulClient } from './ConsulClient'

import {
  getRequest,
  updateRequest,
} from './request'

import {
  IConsulMetadata,
  IKey,
} from './types'

import { decodeBase64 } from './utils'

export const DEFAULT_HOST: string = 'localhost:8500'
export const DEFAULT_API_VERSION: string = 'v1'

export const CONSUL_ADDRESS: string = 'CONSUL_ADDRESS'
export const CONSUL_KV_DC: string = 'CONSUL_KV_DC'
export const CONSUL_KEYS: string = 'CONSUL_KEYS'

const defaultAddress: string = process.env[CONSUL_ADDRESS] || ''

/**
 * This class wraps Consul's key/value HTTP API
 */
export class KvStore {
  private client: ConsulClient

  constructor(
    private consulAddress: string = defaultAddress,
  ) {
    this.client = new ConsulClient(this.consulAddress)
  }

  /**
   * Consul returns values wrapped in metadata.
   *
   * {
   *   "CreateIndex": 100,
   *   "ModifyIndex": 200,
   *   "LockIndex": 200,
   *   "Key": "zip",
   *   "Flags": 0,
   *   "Value": "dGVzdA==",
   *   "Session": "adf4238a-882b-9ddc-4a9d-5b6758e4159e"
   * }
   *
   * The Value is a Base64 encoded string
   */
  public get<T>(key: IKey, requestOptions: CoreOptions = {}): Promise<T | null> {
    return this.client.apply(getRequest({ key }), requestOptions).then((res: RequestResponse) => {
      switch (res.statusCode) {
        case 200:
          const metadata: Array<IConsulMetadata> = res.body
          return Promise.resolve(decodeBase64(metadata[0].Value) as T)

        case 404:
          return Promise.resolve(null)

        default:
          return Promise.reject(new Error(res.statusMessage))
      }
    })
  }

  public set(key: IKey, data: any, requestOptions: CoreOptions = {}): Promise<boolean> {
    return this.client.apply(updateRequest({
      key,
      value: data,
    }), requestOptions).then((res: RequestResponse) => {
      switch (res.statusCode) {
        case 200:
          return Promise.resolve(res.body as boolean)

        case 404:
          return Promise.resolve(false)

        default:
          return Promise.reject(new Error(res.statusMessage))
      }
    })
  }
}
