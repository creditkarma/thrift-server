import {
    BinaryProtocol,
    BufferedTransport,
    deepMerge,
    IClientConstructor,
    ThriftClient,
} from '@creditkarma/thrift-server-core'

import { HttpConnection } from './HttpConnection'
import { NullConnection } from './NullConnection'

import {
    ICreateHttpClientOptions,
    ICreateTcpClientOptions,
    RequestOptions,
} from '../types'

import { TcpConnection } from './TcpConnection'

export * from './HttpConnection'
export * from './TcpConnection'

export function createClient<TClient extends ThriftClient<RequestOptions>>(
    ServiceClient: IClientConstructor<TClient, RequestOptions>,
    options: ICreateHttpClientOptions,
): TClient {
    console.warn(`[Deprecated]: Please use 'createHttpClient' instead`)
    return createHttpClient<TClient>(ServiceClient, options)
}

export function createTcpClient<TClient extends ThriftClient<void>>(
    ServiceClient: IClientConstructor<TClient, void>,
    options: ICreateTcpClientOptions,
): TClient {
    const connection: TcpConnection = new TcpConnection(options)

    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}

export function createHttpClient<TClient extends ThriftClient<RequestOptions>>(
    ServiceClient: IClientConstructor<TClient, RequestOptions>,
    options: ICreateHttpClientOptions,
): TClient {
    const nullConnection: NullConnection = new NullConnection(
        BufferedTransport,
        BinaryProtocol,
    )
    const nullClient: TClient = new ServiceClient(nullConnection)
    const connection: HttpConnection = new HttpConnection(
        deepMerge(options, {
            serviceName: nullClient._serviceName,
        }),
    )

    // Register optional middleware
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}
