import {
  ProtocolType,
  ThriftConnection,
  TransportType,
} from '@creditkarma/thrift-server-core'

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

export interface ICreateClientOptions<Request, Options> extends IHttpConnectionOptions {
    serviceName?: string
    register?: Array<ThriftMiddleware<Request, Options>>
    requestOptions?: request.CoreOptions
}

export interface IClientConstructor<TClient, Context> {
    new (
        connection: ThriftConnection<Context>,
    ): TClient
}

export type MiddlewareType =
    'outgoing' | 'incoming'

export type ThriftMiddleware<Request, Options> =
    IIncomingMiddlewareConfig | IOutgoingMiddlewareConfig<Request, Options>

export interface IThriftMiddlewareConfig {
    type?: MiddlewareType
    methods?: Array<string>
}

export type IncomingHandler = (data: Buffer) => Promise<Buffer>

export type OutgoingHandler<Request, Options> = (request: Request, options: Options) => Promise<Options>

export interface IIncomingMiddlewareConfig extends IThriftMiddlewareConfig {
    type?: 'incoming'
    handler: IncomingHandler
}

export interface IOutgoingMiddlewareConfig<Request, Options> extends IThriftMiddlewareConfig {
    type: 'outgoing'
    handler: OutgoingHandler<Request, Options>
}

export interface IThriftMiddleware {
    type: MiddlewareType
    methods: Array<string>
}

export interface IIncomingMiddleware extends IThriftMiddleware {
    type: 'incoming'
    handler: IncomingHandler
}

export interface IOutgoingMiddleware<Request, Options> extends IThriftMiddleware {
    type: 'outgoing'
    handler: OutgoingHandler<Request, Options>
}
