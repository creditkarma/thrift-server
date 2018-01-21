import { CoreOptions, RequestResponse } from 'request'

import { ConsulClient } from './ConsulClient'

import {
  deleteRequest,
  getRequest,
  updateRequest,
} from './request'

import {
  IConsulMetadata,
  IKey,
} from './types'

import {
  CONSUL_ADDRESS,
  DEFAULT_HOST,
} from './constants'

import {
  decodeBase64,
  deepMerge,
} from './utils'

const defaultAddress: string = process.env[CONSUL_ADDRESS] || DEFAULT_HOST

/**
 * This class wraps Consul's key/value HTTP API
 */
export class KvStore {
  private client: ConsulClient
  private consulAddress: string
  private baseOptions: CoreOptions

  constructor(
    consulAddress: string = defaultAddress,
    baseOptions: CoreOptions = {},
  ) {
    this.consulAddress = consulAddress
    this.baseOptions = baseOptions
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
    const extendedOptions = deepMerge(this.baseOptions, requestOptions)
    return this.client.send(getRequest({ key }), extendedOptions).then((res: RequestResponse) => {
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
    const extendedOptions = deepMerge(this.baseOptions, requestOptions)
    return this.client.send(updateRequest({
      key,
      value: data,
    }), extendedOptions).then((res: RequestResponse) => {
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

  public delete(key: IKey, requestOptions: CoreOptions = {}): Promise<boolean> {
    const extendedOptions = deepMerge(this.baseOptions, requestOptions)
    return this.client.send(deleteRequest({
      key,
    }), extendedOptions).then((res: RequestResponse) => {
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
