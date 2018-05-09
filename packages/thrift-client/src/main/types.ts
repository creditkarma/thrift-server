import {
    IRequestHeaders,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

import * as request from 'request'
import * as tls from 'tls'

export interface IRequestResponse {
    statusCode: number
    headers: IRequestHeaders
    body: Buffer
}

export type ThriftContext<Context> =
    Context & { request?: { headers: IRequestHeaders} }

export type ClientOptionsFunction<Context> =
    () => ThriftContext<Context>

export interface IConnectionOptions {
    hostName: string
    port: number
    timeout?: number
    transport?: TransportType
    protocol?: ProtocolType
    tls?: tls.TlsOptions
}

export interface ICreateTcpClientOptions extends IConnectionOptions {
    serviceName?: string
    register?: Array<IThriftMiddlewareConfig<void>>
}

export interface IHttpConnectionOptions<Context = never> {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
    context?: ThriftContext<Context> | ClientOptionsFunction<Context>
}

export interface ICreateHttpClientOptions<Context> extends IHttpConnectionOptions<Context> {
    serviceName?: string
    register?: Array<IThriftMiddlewareConfig<Context>>
    requestOptions?: request.CoreOptions
}

export type NextFunction<Options> =
    (data?: Buffer, options?: Options) => Promise<IRequestResponse>

export type RequestHandler<Context> = (
    data: Buffer,
    context: Context,
    next: NextFunction<Context>,
) => Promise<IRequestResponse>

export interface IThriftMiddleware<Options> {
    methods: Array<string>
    handler: RequestHandler<Options>
}

export interface IThriftMiddlewareConfig<Options> {
    methods?: Array<string>
    handler: RequestHandler<Options>
}
