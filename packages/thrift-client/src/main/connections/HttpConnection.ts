import {
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
    IRequestResponse,
    IThriftMiddleware,
    IThriftMiddlewareConfig,
    RequestHandler,
    ThriftContext,
} from '../types'

import {
    deepMerge,
} from '../utils'

import {
    filterByMethod,
    getHandler,
    normalizePath,
} from './utils'

export type HttpProtocol =
    'http' | 'https'

export type RequestInstance =
    RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class HttpConnection extends ThriftConnection<ThriftContext<CoreOptions>> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly middleware: Array<IThriftMiddleware<CoreOptions>>
    private readonly request: RequestAPI<Request, CoreOptions, RequiredUriUrl>

    constructor(request: RequestInstance, {
        hostName,
        port,
        path = '/thrift',
        https = false,
        transport = 'buffered',
        protocol = 'binary',
    }: IHttpConnectionOptions<CoreOptions>) {
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
        this.middleware = []
    }

    public register(...middleware: Array<IThriftMiddlewareConfig<CoreOptions>>): void {
        middleware.forEach((next: IThriftMiddlewareConfig<CoreOptions>) => {
            this.middleware.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: ThriftContext<CoreOptions> = this.emptyContext(),
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)
        const handlers: Array<RequestHandler<CoreOptions>> = this.handlersForMethod(requestMethod)
        const requestContext: ThriftContext<CoreOptions> = deepMerge(context, {
            methodName: requestMethod,
            uri: this.url,
        })

        const applyHandlers = (
            currentData: Buffer,
            currentContext: ThriftContext<CoreOptions>,
            [head, ...tail]: Array<RequestHandler<CoreOptions>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(currentData, currentContext)

            } else {
                return head(currentData, currentContext, (nextData?: Buffer, nextContext?: CoreOptions): Promise<IRequestResponse> => {
                    const resolvedContext = deepMerge(currentContext, (nextContext || {}))
                    return applyHandlers((nextData || currentData), resolvedContext, tail)
                })
            }
        }

        return applyHandlers(dataToSend, requestContext, handlers).then((res: IRequestResponse) => {
            return res.body
        })
    }

    public emptyContext(): ThriftContext<CoreOptions> {
        return {}
    }

    public write(dataToWrite: Buffer, options: CoreOptions = {}): Promise<IRequestResponse> {
        // Merge user options with required options
        const requestOptions: CoreOptions & UrlOptions = deepMerge(options, {
            method: 'POST',
            body: dataToWrite,
            encoding: null, // Needs to be explicitly set to null to get Buffer in response body
            url: this.url,
            headers: {
                'content-length': dataToWrite.length,
                'content-type': 'application/octet-stream',
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

    private handlersForMethod(name: string): Array<RequestHandler<CoreOptions>> {
        return this.middleware
            .filter(filterByMethod(name))
            .map(getHandler)
    }
}
