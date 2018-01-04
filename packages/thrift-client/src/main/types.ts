import {
  ProtocolType,
  TransportType,
} from '@creditkarma/thrift-server-core'

export interface IHttpConnectionOptions {
  hostName: string
  port: number
  path?: string
  https?: boolean
  transport?: TransportType
  protocol?: ProtocolType
}

export type MiddlewareType =
  'outgoing' | 'incoming'

export type ThriftMiddlewareConfig<Context> =
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
