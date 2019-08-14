import {
    IRequestHeaders,
    LogFunction,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

import * as GenericPool from 'generic-pool'

import * as request from 'request'
import * as tls from 'tls'

export type RequestOptions = request.CoreOptions

export interface IRequestResponse {
    statusCode: number
    headers: IRequestHeaders
    body: Buffer
}

export interface IRequest {
    headers: IRequestHeaders
}

export interface IThriftRequest<Context> {
    data: Buffer
    methodName: string
    uri: string
    context: Context
    logger?: LogFunction
}

export type ClientOptionsFunction<Options> = () => IThriftRequest<Options>

export interface IConnectionOptions {
    hostName: string
    port: number
    timeout?: number
    transport?: TransportType
    protocol?: ProtocolType
    tls?: tls.TlsOptions
    pool?: GenericPool.Options
    logger?: LogFunction
}

export interface ICreateTcpClientOptions extends IConnectionOptions {
    serviceName?: string
    register?: Array<IThriftClientFilterConfig<void>>
}

export interface IHttpConnectionOptions {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
    serviceName?: string
    context?:
        | IThriftRequest<RequestOptions>
        | ClientOptionsFunction<RequestOptions>
    requestOptions?: RequestOptions
    withEndpointPerMethod?: boolean
    headerBlacklist?: Array<string>
}

export interface ICreateHttpClientOptions extends IHttpConnectionOptions {
    register?: Array<IThriftClientFilterConfig<RequestOptions>>
    requestOptions?: RequestOptions
}

export type NextFunction<Options> = (
    data?: Buffer,
    options?: Options,
) => Promise<IRequestResponse>

export type RequestHandler<Context> = (
    request: IThriftRequest<Context>,
    next: NextFunction<Context>,
) => Promise<IRequestResponse>

export interface IThriftClientFilter<Context> {
    methods: Array<string>
    handler: RequestHandler<Context>
}

export interface IThriftClientFilterConfig<Context> {
    methods?: Array<string>
    handler: RequestHandler<Context>
}
