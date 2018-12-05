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

import { filterByMethod, normalizePath } from './utils'

export type HttpProtocol = 'http' | 'https'

export type RequestInstance = RequestAPI<
    Request,
    RequestOptions,
    RequiredUriUrl
>

export class HttpConnection extends Core.ThriftConnection<RequestOptions> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<IThriftClientFilter<RequestOptions>>
    private readonly requestOptions: RequestOptions

    constructor({
        hostName,
        port,
        path = '/thrift',
        https = false,
        transport = 'buffered',
        protocol = 'binary',
        requestOptions = {},
    }: IHttpConnectionOptions) {
        super(Core.getTransport(transport), Core.getProtocol(protocol))
        this.requestOptions = Object.freeze(requestOptions)
        this.port = port
        this.hostName = hostName
        this.path = normalizePath(path || '/thrift')
        this.protocol = https === true ? 'https' : 'http'
        this.url = `${this.protocol}://${this.hostName}:${this.port}${
            this.path
        }`
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
                return this.write(currentRequest.data, currentRequest.context)
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

    public write(
        dataToWrite: Buffer,
        options: RequestOptions = {},
    ): Promise<IRequestResponse> {
        // Merge user options with required options
        const requestOptions: RequestOptions & UrlOptions = Core.overlayObjects(
            this.requestOptions,
            options,
            {
                method: 'POST',
                body: dataToWrite,
                encoding: null, // Needs to be explicitly set to null to get Buffer in response body
                url: this.url,
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
                    if (err !== null) {
                        reject(err)
                    } else if (
                        response.statusCode &&
                        (response.statusCode < 200 || response.statusCode > 299)
                    ) {
                        reject(response)
                    } else {
                        resolve({
                            statusCode: response.statusCode,
                            headers: response.headers,
                            body,
                        })
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
