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
    OptionsOfBufferResponseBody,
} from '../types'

import { TcpConnection } from './TcpConnection'

export * from './HttpConnection'
export * from './TcpConnection'

export function createClient<
    TClient extends ThriftClient<OptionsOfBufferResponseBody>
>(
    ServiceClient: IClientConstructor<TClient, OptionsOfBufferResponseBody>,
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

export function createHttpClient<
    TClient extends ThriftClient<RequestOptions>
>(
    ServiceClient: IClientConstructor<
        TClient,
        RequestOptions
    >,
    options: ICreateHttpClientOptions,
): TClient {
    let serviceName: string = ''
    if ((ServiceClient as any).serviceName !== 'undefined') {
        serviceName = (ServiceClient as any).serviceName
    } else {
        const nullConnection: NullConnection = new NullConnection(
            BufferedTransport,
            BinaryProtocol,
        )
        const nullClient: TClient = new ServiceClient(nullConnection)
        serviceName = nullClient._serviceName
    }

    const connection: HttpConnection = new HttpConnection(
        deepMerge(options, { serviceName }),
    )

    // Register optional middleware
    connection.register(...(options.register || []))

    return new ServiceClient(connection)
}
