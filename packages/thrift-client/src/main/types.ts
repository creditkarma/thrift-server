import {
    ProtocolType,
    ThriftConnection,
    TransportType,
} from '@creditkarma/thrift-core'

import * as request from 'request'

export interface IThriftContext<Request, Options> {
    request?: Request
    options?: Options
}

export interface IHttpConnectionOptions {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
}

export interface ICreateClientOptions<Context> extends IHttpConnectionOptions {
    serviceName?: string
    register?: Array<ThriftMiddleware<Context>>
    requestOptions?: request.CoreOptions
}

export interface IClientConstructor<TClient, Context> {
    new(
        connection: ThriftConnection<Context>,
    ): TClient
}

export type MiddlewareType =
    'request' | 'response'

export type ThriftMiddleware<Context> =
    IResponseMiddlewareConfig | IRequestMiddlewareConfig<Context>

export interface IThriftMiddlewareConfig {
    type?: MiddlewareType
    methods?: Array<string>
}

export type ResponseHandler = (data: Buffer) => Promise<Buffer>

export type RequestHandler<Context> = (context: Context) => Promise<Context>

export interface IResponseMiddlewareConfig extends IThriftMiddlewareConfig {
    type?: 'response'
    handler: ResponseHandler
}

export interface IRequestMiddlewareConfig<Context> extends IThriftMiddlewareConfig {
    type: 'request'
    handler: RequestHandler<Context>
}

export interface IThriftMiddleware {
    type: MiddlewareType
    methods: Array<string>
}

export interface IResponseMiddleware extends IThriftMiddleware {
    type: 'response'
    handler: ResponseHandler
}

export interface IRequestMiddleware<Context> extends IThriftMiddleware {
    type: 'request'
    handler: RequestHandler<Context>
}
