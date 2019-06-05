import {
    IRequestContext,
    LogFunction,
    ProtocolType,
    RequestHeaders,
    TransportType,
} from '@creditkarma/thrift-server-core'

import * as request from 'request'

export type RequestOptions = request.CoreOptions

export interface IRequestResponse {
    statusCode: number
    headers: Record<string, any>
    body: Buffer
}

export interface IRequest {
    headers: Record<string, any>
}

export interface IThriftRequest<
    Context extends IRequestContext = IRequestContext
> {
    data: Buffer
    methodName: string
    uri: string
    context?: Context
    logger?: LogFunction
}

export type ClientOptionsFunction<Options> = () => IThriftRequest<Options>

export interface IConnectionOptions {
    hostName: string
    port: number
    timeout?: number
    transport?: TransportType
    protocol?: ProtocolType
    logger?: LogFunction
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
}

export interface ICreateHttpClientOptions extends IHttpConnectionOptions {
    register?: Array<IThriftClientFilterConfig<IRequestContext>>
    requestOptions?: RequestOptions
}

export type NextFunction = (
    data?: Buffer,
    options?: { headers?: RequestHeaders },
) => Promise<IRequestResponse>

export type RequestHandler<Context extends IRequestContext> = (
    request: IThriftRequest<Context>,
    next: NextFunction,
) => Promise<IRequestResponse>

export interface IThriftClientFilter<Context extends IRequestContext> {
    methods: Array<string>
    handler: RequestHandler<Context>
}

export interface IThriftClientFilterConfig<Context extends IRequestContext> {
    methods?: Array<string>
    handler: RequestHandler<Context>
}
