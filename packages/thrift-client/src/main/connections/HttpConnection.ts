import {
    deepMerge,
    getProtocol,
    getTransport,
    readThriftMethod,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

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
    IRequest,
    IRequestResponse,
    IThriftClientFilter,
    IThriftClientFilterConfig,
    IThriftContext,
    RequestHandler,
} from '../types'

import {
    filterByMethod,
    getHandler,
    normalizePath,
} from './utils'

export type HttpProtocol =
    'http' | 'https'

export type RequestInstance =
    RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class HttpConnection extends ThriftConnection<IRequest> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<IThriftClientFilter<IRequest>>
    private readonly request: RequestAPI<Request, CoreOptions, RequiredUriUrl>

    constructor(request: RequestInstance, {
        hostName,
        port,
        path = '/thrift',
        https = false,
        transport = 'buffered',
        protocol = 'binary',
    }: IHttpConnectionOptions<IRequest>) {
        super(
            getTransport(transport),
            getProtocol(protocol),
        )
        this.request = request
        this.port = port
        this.hostName = hostName
        this.path = normalizePath(path || '/thrift')
        this.protocol = ((https === true) ? 'https' : 'http')
        this.url = `${this.protocol}://${this.hostName}:${this.port}${this.path}`
        this.filters = []
    }

    public register(...filters: Array<IThriftClientFilterConfig<IRequest>>): void {
        filters.forEach((next: IThriftClientFilterConfig<IRequest>) => {
            this.filters.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: IRequest = { headers: {} },
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)
        const handlers: Array<RequestHandler<IRequest>> = this.handlersForMethod(requestMethod)
        const resolvedContext: IThriftContext<IRequest> = {
            methodName: requestMethod,
            uri: this.url,
            request: context,
        }

        let mergedOptions: CoreOptions = {}

        const applyHandlers = (
            currentData: Buffer,
            currentContext: IThriftContext<IRequest>,
            [head, ...tail]: Array<RequestHandler<IRequest>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(currentData, mergedOptions)

            } else {
                return head(currentData, currentContext, (nextData?: Buffer, nextOptions?: CoreOptions): Promise<IRequestResponse> => {
                    mergedOptions = deepMerge(mergedOptions, (nextOptions || {}))
                    return applyHandlers((nextData || currentData), currentContext, tail)
                })
            }
        }

        return applyHandlers(dataToSend, resolvedContext, handlers).then((res: IRequestResponse) => {
            return res.body
        })
    }

    public write(dataToWrite: Buffer, options: CoreOptions = {}): Promise<IRequestResponse> {
        // Merge user options with required options
        const requestOptions: CoreOptions & UrlOptions = deepMerge(options, {
            method: 'POST',
            body: dataToWrite,
            encoding: null, // Needs to be explicitly set to null to get Buffer in response body
            url: this.url,
            headers: {
                'Content-Length': dataToWrite.length,
                'Content-Type': 'application/octet-stream',
            },
        })

        return new Promise((resolve, reject) => {
            this.request(requestOptions, (err: any, response: RequestResponse, body: Buffer) => {
                if (err !== null) {
                    reject(err)

                } else if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
                    reject(response)

                } else {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body,
                    })
                }
            })
        })
    }

    private handlersForMethod(name: string): Array<RequestHandler<IRequest>> {
        return this.filters
            .filter((filter: IThriftClientFilter<IRequest>) => filterByMethod<IRequest>(name)(filter))
            .map(getHandler)
    }
}
