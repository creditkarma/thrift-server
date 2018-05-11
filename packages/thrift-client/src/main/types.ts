import {
    IRequestHeaders,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

import * as request from 'request'

export interface IRequestResponse {
    statusCode: number
    headers: IRequestHeaders
    body: Buffer
}

export type ThriftContext<Options> =
    Options & { request?: { headers: IRequestHeaders} }

export type ClientOptionsFunction<Options> =
    () => ThriftContext<Options>

export interface IHttpConnectionOptions<Options> {
    hostName: string
    port: number
    path?: string
    https?: boolean
    transport?: TransportType
    protocol?: ProtocolType
    context?: ThriftContext<Options> | ClientOptionsFunction<Options>
}

export interface ICreateHttpClientOptions<Options> extends IHttpConnectionOptions<Options> {
    serviceName?: string
    register?: Array<IThriftMiddlewareConfig<Options>>
    requestOptions?: request.CoreOptions
}

export type NextFunction<Options> =
    (data?: Buffer, options?: Options) => Promise<IRequestResponse>

export type RequestHandler<Options> = (
    data: Buffer,
    context: ThriftContext<Options>,
    next: NextFunction<Options>,
) => Promise<IRequestResponse>

export interface IThriftMiddleware<Options> {
    methods: Array<string>
    handler: RequestHandler<Options>
}

export interface IThriftMiddlewareConfig<Options> {
    methods?: Array<string>
    handler: RequestHandler<Options>
}
