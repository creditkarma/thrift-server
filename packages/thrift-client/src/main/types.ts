import {
  IThriftConnection,
  ProtocolType,
  TransportType,
} from '@creditkarma/thrift-server-core'

import * as request from 'request'

export interface IHttpConnectionOptions {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
}

export interface ICreateClientOptions<Context> extends IHttpConnectionOptions {
    register?: Array<ThriftMiddleware<Context>>
    requestOptions?: request.CoreOptions
}

export interface IClientConstructor<TClient, Context> {
    new (
        connection: IThriftConnection<Context>,
    ): TClient
}

export type MiddlewareType =
    'outgoing' | 'incoming'

export type ThriftMiddleware<Context> =
    IIncomingMiddlewareConfig | IOutgoingMiddlewareConfig<Context>

export interface IThriftMiddlewareConfig {
    type?: MiddlewareType
    methods?: string[]
}

export type IncomingHandler = (data: Buffer) => Promise<Buffer>

export type OutgoingHandler<Context> = (context: Context) => Promise<Context>

export interface IIncomingMiddlewareConfig extends IThriftMiddlewareConfig {
    type?: 'incoming'
    handler: IncomingHandler
}

export interface IOutgoingMiddlewareConfig<Context> extends IThriftMiddlewareConfig {
    type: 'outgoing'
    handler: OutgoingHandler<Context>
}

export interface IThriftMiddleware {
    type: MiddlewareType
    methods: string[]
}

export interface IIncomingMiddleware extends IThriftMiddleware {
    type: 'incoming'
    handler: IncomingHandler
}

export interface IOutgoingMiddleware<Context> extends IThriftMiddleware {
    type: 'outgoing'
    handler: OutgoingHandler<Context>
}
