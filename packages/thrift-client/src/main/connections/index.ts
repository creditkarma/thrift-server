export * from './HttpConnection'
export * from './AxiosConnection'
export * from './RequestConnection'

import { AxiosInstance } from 'axios'
import * as request from 'request'

import {
  IThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
  AxiosConnection,
} from './AxiosConnection'

import {
  RequestConnection,
  RequestInstance,
} from './RequestConnection'

import {
  IHttpConnectionOptions,
  ThriftMiddleware,
} from '../types'

export function fromAxios(
  requestApi: AxiosInstance,
  options: IHttpConnectionOptions): AxiosConnection {
  return new AxiosConnection(requestApi, options)
}

export function fromRequest(
  requestApi: RequestInstance,
  options: IHttpConnectionOptions): RequestConnection {
  return new RequestConnection(requestApi, options)
}

export interface IClientConstructor<TClient, Context> {
  new (
    connection: IThriftConnection<Context>,
  ): TClient
}

export interface ICreateClientOptions<Context> extends IHttpConnectionOptions {
  register?: Array<ThriftMiddleware<Context>>
  requestOptions?: request.CoreOptions
}

export function createClient<TClient>(
  ServiceClient: IClientConstructor<TClient, request.CoreOptions>,
  options: ICreateClientOptions<request.CoreOptions>,
): TClient {
  const requestClient: RequestInstance = request.defaults(options.requestOptions || {})

  const connection: RequestConnection =
    fromRequest(requestClient, options)

  // Register optional middleware
  connection.register(...(options.register || []))

  return new ServiceClient(connection)
}
