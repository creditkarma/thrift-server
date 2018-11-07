import { IClientConstructor } from '@creditkarma/thrift-server-core'
import * as request from 'request'

import { HttpConnection, RequestInstance } from './HttpConnection'

import { ICreateHttpClientOptions, ICreateTcpClientOptions } from '../types'

import { TcpConnection } from './TcpConnection'

export * from './HttpConnection'
export * from './TcpConnection'

export function createClient<TClient>(
    ServiceClient: IClientConstructor<TClient, request.CoreOptions>,
    options: ICreateHttpClientOptions,
): TClient {
    console.warn(`[Deprecated]: Please use 'createHttpClient' instead`)
    return createHttpClient<TClient>(ServiceClient, options)
}

export function createTcpClient<TClient>(
    ServiceClient: IClientConstructor<TClient, void>,
    options: ICreateTcpClientOptions,
): TClient {
    const connection: TcpConnection = new TcpConnection(options)

    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}

export function createHttpClient<TClient>(
    ServiceClient: IClientConstructor<TClient, request.CoreOptions>,
    options: ICreateHttpClientOptions,
): TClient {
    const requestClient: RequestInstance = request.defaults(
        options.requestOptions || {},
    )

    const connection: HttpConnection = new HttpConnection(
        requestClient,
        options,
    )

    // Register optional middleware
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}
