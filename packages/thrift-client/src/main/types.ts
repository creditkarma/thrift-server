import {
    IRequestHeaders,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

import { TraceId } from 'zipkin'

import * as GenericPool from 'generic-pool'

import * as request from 'request'
import * as tls from 'tls'

export interface IRequestResponse {
    statusCode: number
    headers: IRequestHeaders
    body: Buffer
}

export interface IRequest {
    headers: IRequestHeaders
}

export interface IThriftContext<Context> {
    traceId?: TraceId
    methodName: string
    uri: string
    request: Context
}

export type ClientOptionsFunction<Options> =
    () => IThriftContext<Options>

export interface IConnectionOptions {
    hostName: string
    port: number
    timeout?: number
    transport?: TransportType
    protocol?: ProtocolType
    tls?: tls.TlsOptions
    pool?: GenericPool.Options
}

export interface ICreateTcpClientOptions extends IConnectionOptions {
    serviceName?: string
    register?: Array<IThriftTcpFilterConfig<void>>
}

export interface IHttpConnectionOptions<Options> {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
    context?: IThriftContext<Options> | ClientOptionsFunction<Options>
}

export interface ICreateHttpClientOptions<Context> extends IHttpConnectionOptions<Context> {
    serviceName?: string
    register?: Array<IThriftClientFilterConfig<Context>>
    requestOptions?: request.CoreOptions
}

export type NextFunction<Options> =
    (data?: Buffer, options?: Options) => Promise<IRequestResponse>

export type RequestHandler<Options> = (
    data: Buffer,
    context: IThriftContext<Options>,
    next: NextFunction<request.CoreOptions>,
) => Promise<IRequestResponse>

export interface IThriftClientFilter<Options> {
    methods: Array<string>
    handler: RequestHandler<Options>
}

export interface IThriftClientFilterConfig<Options> {
    methods?: Array<string>
    handler: RequestHandler<Options>
}

export type TcpRequestHandler<Options> = (
    data: Buffer,
    context: IThriftContext<Options>,
    next: NextFunction<Options>,
) => Promise<IRequestResponse>

export interface IThriftTcpFilter<Options> {
    methods: Array<string>
    handler: TcpRequestHandler<Options>
}

export interface IThriftTcpFilterConfig<Options> {
    methods?: Array<string>
    handler: TcpRequestHandler<Options>
}
