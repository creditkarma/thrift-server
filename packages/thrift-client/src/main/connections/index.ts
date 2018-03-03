import { IClientConstructor } from '@creditkarma/thrift-server-core'
import * as request from 'request'

import {
    RequestConnection,
    RequestInstance,
} from './RequestConnection'

import {
    ICreateClientOptions,
} from '../types'

export * from './HttpConnection'
export * from './RequestConnection'

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

export function createHttpClient<TClient>(
    ServiceClient: IClientConstructor<TClient, request.CoreOptions>,
    options: ICreateClientOptions<request.CoreOptions>,
): TClient {
    return createClient<TClient>(ServiceClient, options)
}
