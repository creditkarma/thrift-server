import * as Core from '@creditkarma/thrift-server-core'

import request = require('request')
import {
    CoreOptions,
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
} from '../types'

import { filterByMethod, normalizePath } from './utils'

export type HttpProtocol = 'http' | 'https'

export type RequestInstance = RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class HttpConnection extends Core.ThriftConnection<CoreOptions> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<IThriftClientFilter<CoreOptions>>
    private readonly requestOptions: CoreOptions

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
        ...filters: Array<IThriftClientFilterConfig<CoreOptions>>
    ): void {
        filters.forEach((next: IThriftClientFilterConfig<CoreOptions>) => {
            this.filters.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: CoreOptions = {},
    ): Promise<Buffer> {
        const requestMethod: string = Core.readThriftMethod(
            dataToSend,
            this.Transport,
            this.Protocol,
        )

        const handlers: Array<
            RequestHandler<CoreOptions>
        > = this.handlersForMethod(requestMethod)

        const thriftRequest: IThriftRequest<CoreOptions> = {
            data: dataToSend,
            methodName: requestMethod,
            uri: this.url,
            context,
        }

        const applyHandlers = (
            currentRequest: IThriftRequest<CoreOptions>,
            [head, ...tail]: Array<RequestHandler<CoreOptions>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(currentRequest.data, currentRequest.context)
            } else {
                return head(
                    thriftRequest,
                    (
                        nextData?: Buffer,
                        nextOptions?: CoreOptions,
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
        options: CoreOptions = {},
    ): Promise<IRequestResponse> {
        // Merge user options with required options
        const requestOptions: CoreOptions & UrlOptions = Core.overlayObjects(
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
    ): Array<RequestHandler<CoreOptions>> {
        return this.filters
            .filter(filterByMethod<CoreOptions>(name))
            .map((filter: IThriftClientFilter<CoreOptions>) => filter.handler)
    }
}
