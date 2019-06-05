import * as request from 'request'

import {
    Request,
    RequestAPI,
    RequestResponse,
    RequiredUriUrl,
    UrlOptions,
} from 'request'

import {
    IHttpConnectionOptions,
    IRequestResponse,
    IThriftClientFilter,
    IThriftClientFilterConfig,
    IThriftRequest,
    RequestHandler,
    RequestOptions,
} from '../types'

import {
    deepMerge,
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IRequestContext,
    IThriftConnection,
    ITransportConstructor,
    normalizePath,
    overlayObjects,
    readThriftMethod,
    RequestHeaders,
} from '@creditkarma/thrift-server-core'

import { filterByMethod } from './utils'

export const DEFAULT_PATH: string = '/thrift'

export type HttpProtocol = 'http' | 'https'

export type RequestInstance = RequestAPI<
    Request,
    RequestOptions,
    RequiredUriUrl
>

function shouldRetry(
    response: RequestResponse,
    retry: boolean,
    withEndpointPerMethod: boolean,
): boolean {
    return (
        withEndpointPerMethod &&
        response !== undefined &&
        response !== null &&
        response.statusCode !== undefined &&
        response.statusCode === 404 &&
        retry === false
    )
}

function hasError(err: any): boolean {
    return err !== undefined && err !== null
}

function isErrorResponse(response: RequestResponse): boolean {
    return (
        response.statusCode !== null &&
        response.statusCode !== undefined &&
        (response.statusCode < 200 || response.statusCode > 299)
    )
}

export class HttpConnection implements IThriftConnection<IRequestContext> {
    public readonly Transport: ITransportConstructor
    public readonly Protocol: IProtocolConstructor

    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly basePath: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<IThriftClientFilter<IRequestContext>>

    private readonly requestOptions: RequestOptions
    private readonly serviceName: string | undefined
    private readonly withEndpointPerMethod: boolean

    constructor({
        hostName,
        port,
        path = '/thrift',
        https = false,
        transport = 'buffered',
        protocol = 'binary',
        requestOptions = {},
        serviceName,
        withEndpointPerMethod = false,
    }: IHttpConnectionOptions) {
        this.Transport = getTransport(transport)
        this.Protocol = getProtocol(protocol)
        this.requestOptions = Object.freeze(requestOptions)
        this.port = port
        this.hostName = hostName
        this.path = normalizePath(path || DEFAULT_PATH)
        this.protocol = https === true ? 'https' : 'http'
        this.serviceName = serviceName
        this.basePath = `${this.protocol}://${this.hostName}:${this.port}`
        this.withEndpointPerMethod = withEndpointPerMethod
        this.url = `${this.basePath}${this.path}`
        this.filters = []
    }

    public register(
        ...filters: Array<IThriftClientFilterConfig<IRequestContext>>
    ): void {
        filters.forEach((next: IThriftClientFilterConfig<IRequestContext>) => {
            this.filters.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: IRequestContext = {},
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(
            dataToSend,
            this.Transport,
            this.Protocol,
        )

        const handlers: Array<
            RequestHandler<IRequestContext>
        > = this.handlersForMethod(requestMethod)

        const thriftRequest: IThriftRequest<IRequestContext> = {
            data: dataToSend,
            methodName: requestMethod,
            uri: this.url,
            context,
        }

        const applyHandlers = (
            currentRequest: IThriftRequest<IRequestContext>,
            [head, ...tail]: Array<RequestHandler<IRequestContext>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(
                    currentRequest.data,
                    currentRequest.methodName,
                    currentRequest.context,
                )
            } else {
                return head(
                    thriftRequest,
                    (
                        nextData?: Buffer,
                        nextOptions?: RequestOptions,
                    ): Promise<IRequestResponse> => {
                        return applyHandlers(
                            {
                                data: nextData || currentRequest.data,
                                methodName: currentRequest.methodName,
                                uri: currentRequest.uri,
                                context: deepMerge(
                                    currentRequest.context,
                                    nextOptions || {},
                                ),
                            },
                            tail,
                        )
                    },
                )
            }
        }

        return applyHandlers(thriftRequest, handlers).then(
            (res: IRequestResponse) => {
                return res.body
            },
        )
    }

    private write(
        dataToWrite: Buffer,
        methodName: string,
        context: { headers?: RequestHeaders } = {},
        retry: boolean = false,
    ): Promise<IRequestResponse> {
        const requestUrl: string =
            this.withEndpointPerMethod && retry === false
                ? `${this.url}/${this.serviceName}/${methodName}`
                : this.url

        // Merge user options with required options
        const requestOptions: RequestOptions & UrlOptions = overlayObjects(
            this.requestOptions,
            context,
            {
                method: 'POST',
                body: dataToWrite,
                encoding: null, // Needs to be explicitly set to null to get Buffer in response body
                url: requestUrl,
                headers: {
                    'Content-Length': dataToWrite.length,
                    'Content-Type': 'application/octet-stream',
                },
            },
        )

        return new Promise((resolve, reject) => {
            request(
                requestOptions,
                (err: any, response: RequestResponse, body: Buffer) => {
                    if (
                        shouldRetry(response, retry, this.withEndpointPerMethod)
                    ) {
                        resolve(
                            this.write(dataToWrite, methodName, context, true),
                        )
                    } else {
                        if (hasError(err)) {
                            reject(err)
                        } else if (isErrorResponse(response)) {
                            reject(response)
                        } else {
                            resolve({
                                statusCode: response.statusCode,
                                headers: response.headers,
                                body,
                            })
                        }
                    }
                },
            )
        })
    }

    private handlersForMethod(
        name: string,
    ): Array<RequestHandler<IRequestContext>> {
        return this.filters
            .filter(filterByMethod<IRequestContext>(name))
            .map(
                (filter: IThriftClientFilter<IRequestContext>) =>
                    filter.handler,
            )
    }
}
