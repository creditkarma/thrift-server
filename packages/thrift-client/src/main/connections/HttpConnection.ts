import * as Core from '@creditkarma/thrift-server-core'

import request = require('request')
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

import { filterByMethod } from './utils'

export const DEFAULT_PATH: string = '/thrift'

export type HttpProtocol = 'http' | 'https'

export type RequestInstance = RequestAPI<
    Request,
    RequestOptions,
    RequiredUriUrl
>

function isErrorResponse(response: RequestResponse): boolean {
    return (
        response.statusCode !== null &&
        response.statusCode !== undefined &&
        (response.statusCode < 200 || response.statusCode > 299)
    )
}

export class HttpConnection extends Core.ThriftConnection<RequestOptions> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly basePath: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<IThriftClientFilter<RequestOptions>>
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
        super(Core.getTransport(transport), Core.getProtocol(protocol))
        this.requestOptions = Object.freeze(requestOptions)
        this.port = port
        this.hostName = hostName
        this.path = Core.normalizePath(path || DEFAULT_PATH)
        this.protocol = https === true ? 'https' : 'http'
        this.serviceName = serviceName
        this.basePath = `${this.protocol}://${this.hostName}:${this.port}`
        this.withEndpointPerMethod = withEndpointPerMethod
        this.url = `${this.basePath}${this.path}`
        this.filters = []
    }

    public register(
        ...filters: Array<IThriftClientFilterConfig<RequestOptions>>
    ): void {
        filters.forEach((next: IThriftClientFilterConfig<RequestOptions>) => {
            this.filters.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: RequestOptions = {},
    ): Promise<Buffer> {
        const requestMethod: string = Core.readThriftMethod(
            dataToSend,
            this.Transport,
            this.Protocol,
        )

        const handlers: Array<
            RequestHandler<RequestOptions>
        > = this.handlersForMethod(requestMethod)

        const thriftRequest: IThriftRequest<RequestOptions> = {
            data: dataToSend,
            methodName: requestMethod,
            uri: this.url,
            context,
        }

        const applyHandlers = (
            currentRequest: IThriftRequest<RequestOptions>,
            [head, ...tail]: Array<RequestHandler<RequestOptions>>,
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
                                context: Core.deepMerge(
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
        options: RequestOptions = {},
        retry: boolean = false,
    ): Promise<IRequestResponse> {
        const requestUrl: string =
            this.withEndpointPerMethod && retry === false
                ? `${this.url}/${this.serviceName}/${methodName}`
                : this.url

        // Merge user options with required options
        const requestOptions: RequestOptions & UrlOptions = Core.overlayObjects(
            this.requestOptions,
            options,
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
                        this.withEndpointPerMethod &&
                        response !== undefined &&
                        response.statusCode !== undefined &&
                        response.statusCode === 404 &&
                        retry === false
                    ) {
                        resolve(
                            this.write(dataToWrite, methodName, options, true),
                        )
                    } else {
                        if (err !== null) {
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
    ): Array<RequestHandler<RequestOptions>> {
        return this.filters
            .filter(filterByMethod<RequestOptions>(name))
            .map(
                (filter: IThriftClientFilter<RequestOptions>) => filter.handler,
            )
    }
}
