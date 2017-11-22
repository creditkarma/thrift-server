import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import {
  ConsulRequest,
  RequestType,
} from './types'

import {
  cleanQueryParams,
  deepMerge,
  removeLeadingTrailingSlash,
  requestToPath,
} from './utils'

export const DEFAULT_HOST: string = 'http://localhost:8500'
export const DEFAULT_API_VERSION: string = 'v1'

export const CONSUL_ADDRESS: string = 'CONSUL_ADDRESS'
export const CONSUL_KV_DC: string = 'CONSUL_KV_DC'
export const CONSUL_KEYS: string = 'CONSUL_KEYS'

export const CONSUL_INDEX_HEADER: string = 'X-Consul-Index'
export const CONSUL_TOKEN_HEADER: string = 'X-Consul-Token'
export const CONSUL_HOST_NAME: string = 'consul'

const request = rpn.defaults({
  json: true,
  simple: false,
  resolveWithFullResponse: true,
})

const defaultAddress: string = process.env[CONSUL_ADDRESS] || DEFAULT_HOST

interface IHeaderMap {
  [key: string]: string | number | undefined
}

function headersForRequest(req: ConsulRequest): IHeaderMap {
  const headers: IHeaderMap = {
    host: CONSUL_HOST_NAME,
  }

  if (req.index) {
    headers[CONSUL_INDEX_HEADER] = (req.index + 1)
  }

  if (req.token) {
    headers[CONSUL_TOKEN_HEADER] = req.token
  }

  return headers
}

export class ConsulClient {
  private destination: string
  constructor(dest?: string) {
    this.destination = (
      (dest !== undefined) ?
        removeLeadingTrailingSlash(dest) :
        removeLeadingTrailingSlash(defaultAddress)
    )
  }

  public apply(req: ConsulRequest, options: CoreOptions = {}): Promise<RequestResponse> {
    switch (req.type) {
      case RequestType.GetRequest:
        return request(deepMerge(options, {
          uri: `${this.destination}/${requestToPath(req)}`,
          method: 'GET',
          headers: headersForRequest(req),
          qs: cleanQueryParams({
            dc: req.key.dc,
            index: req.index,
          }),
        }))

      case RequestType.UpdateRequest:
        return request(deepMerge(options, {
          uri: `${this.destination}/${requestToPath(req)}`,
          body: req.value,
          method: 'PUT',
          headers: headersForRequest(req),
          qs: cleanQueryParams({
            dc: req.key.dc,
          }),
        }))

      default:
        const msg: never = req
        return Promise.reject(new Error(`Unsupported request type: ${msg}`))
    }
  }
}
