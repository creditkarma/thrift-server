import {
    deepMerge,
    IClientConstructor,
    IThriftClient,
} from '@creditkarma/thrift-server-core'

import { HttpConnection } from './HttpConnection'

import {
    ICreateHttpClientOptions,
    ICreateTcpClientOptions,
    RequestOptions,
} from '../types'

import { TcpConnection } from './TcpConnection'

export * from './HttpConnection'
export * from './TcpConnection'
export * from './NullConnection'

export function createTcpClient<TClient extends IThriftClient>(
    ServiceClient: IClientConstructor<TClient, void>,
    options: ICreateTcpClientOptions,
): TClient {
    const connection: TcpConnection = new TcpConnection(options)
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}

export function createHttpClient<TClient extends IThriftClient>(
    ServiceClient: IClientConstructor<TClient, RequestOptions>,
    options: ICreateHttpClientOptions,
): TClient {
    const serviceName: string = ServiceClient.metadata.name

    const connection: HttpConnection = new HttpConnection(
        deepMerge(options, { serviceName }),
    )

    // Register optional middleware
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}
