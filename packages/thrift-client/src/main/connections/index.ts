export * from './HttpConnection'
export * from './RequestConnection'

import * as request from 'request'

import {
  RequestConnection,
  RequestInstance,
} from './RequestConnection'

import {
  IClientConstructor,
  ICreateClientOptions,
} from '../types'

export function createClient<TClient>(
  ServiceClient: IClientConstructor<TClient, request.CoreOptions>,
  options: ICreateClientOptions<request.CoreOptions>,
): TClient {
  const requestClient: RequestInstance =
    request.defaults(options.requestOptions || {})

  const connection: RequestConnection =
    new RequestConnection(requestClient, options)

  // Register optional middleware
  connection.register(...(options.register || []))

  return new ServiceClient(connection)
}
