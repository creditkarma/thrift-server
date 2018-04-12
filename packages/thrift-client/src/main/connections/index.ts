import { IClientConstructor } from '@creditkarma/thrift-server-core'
import * as request from 'request'

import {
    HttpConnection,
    RequestInstance,
} from './HttpConnection'

import {
    ICreateHttpClientOptions,
    ThriftContext,
} from '../types'

export * from './HttpConnection'

export function createClient<TClient>(
    ServiceClient: IClientConstructor<TClient, ThriftContext<request.CoreOptions>>,
    options: ICreateHttpClientOptions<request.CoreOptions>,
): TClient {
    console.warn(`[Deprecated]: Please use 'createHttpClient' instead`)
    return createHttpClient<TClient>(ServiceClient, options)
}

export function createHttpClient<TClient>(
    ServiceClient: IClientConstructor<TClient, ThriftContext<request.CoreOptions>>,
    options: ICreateHttpClientOptions<request.CoreOptions>,
): TClient {
    const requestClient: RequestInstance =
        request.defaults(options.requestOptions || {})

    const connection: HttpConnection =
        new HttpConnection(requestClient, options)

    // Register optional middleware
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}
