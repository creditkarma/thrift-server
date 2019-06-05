import {
    deepMerge,
    IClientConstructor,
    IRequestContext,
    IThriftClient,
} from '@creditkarma/thrift-server-core'

import { HttpConnection } from './HttpConnection'

import { ICreateHttpClientOptions } from '../types'

export * from './HttpConnection'
export * from './NullConnection'

export function createHttpClient<
    TClient extends IThriftClient,
    Context extends IRequestContext = IRequestContext
>(
    ServiceClient: IClientConstructor<TClient, Context>,
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
