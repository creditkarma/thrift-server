import * as Core from '@creditkarma/thrift-server-core'

import got, { HTTPError, OptionsOfBufferResponseBody, Response } from 'got'

import {
    IHttpConnectionOptions,
    IRequestResponse,
    IThriftClientFilter,
    IThriftClientFilterConfig,
    IThriftRequest,
    RequestHandler,
} from '../types'

import { filterByMethod } from './utils'

export const DEFAULT_PATH: string = '/thrift'

export type HttpProtocol = 'http' | 'https'

function shouldRetry(
    response: Response,
    retry: boolean,
    withEndpointPerMethod: boolean,
): boolean {
    return (
        withEndpointPerMethod && response?.statusCode === 404 && retry === false
    )
}

function isErrorResponse(response: Response): boolean {
    return (
        response.statusCode !== null &&
        response.statusCode !== undefined &&
        (response.statusCode < 200 || response.statusCode > 299)
    )
}

function filterHeaders(
    options: OptionsOfBufferResponseBody,
    blacklist: Array<string>,
): OptionsOfBufferResponseBody {
    options.headers = options.headers || {}
    blacklist = blacklist.map((next) => next.toLocaleLowerCase())
    options.headers = Object.keys(options.headers).reduce(
        (
            acc: NonNullable<OptionsOfBufferResponseBody['headers']>,
            next: string,
        ) => {
            if (blacklist.indexOf(next.toLocaleLowerCase()) === -1) {
                acc[next] = options.headers![next]
            }
            return acc
        },
        {},
    )

    return options
}

function applyFilters(
    currentRequest: IThriftRequest<RequestOptions>,
    filters: Array<RequestHandler<RequestOptions>>,
    callback: (
        finalRequest: IThriftRequest<RequestOptions>,
    ) => Promise<IRequestResponse>,
): Promise<IRequestResponse> {
    const [head, ...tail] = filters
    if (head === undefined) {
        return callback(currentRequest)
    } else {
        return head(
            currentRequest,
            (
                nextData?: Buffer,
                nextOptions?: RequestOptions,
            ): Promise<IRequestResponse> => {
                const data: Buffer =
                    nextData !== undefined ? nextData : currentRequest.data

                return applyFilters(
                    {
                        data,
                        methodName: currentRequest.methodName,
                        uri: currentRequest.uri,
                        context: Core.deepMerge(
                            currentRequest.context,
                            nextOptions || {},
                        ),
                    },
                    tail,
                    callback,
                )
            },
        )
    }
}

export class HttpConnection extends Core.ThriftConnection<
    OptionsOfBufferResponseBody
> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly basePath: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly filters: Array<
        IThriftClientFilter<RequestOptions>
    >
    private readonly requestOptions: OptionsOfBufferResponseBody
    private readonly serviceName: string | undefined
    private readonly withEndpointPerMethod: boolean
    private readonly gotImpl: typeof got

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
        headerBlacklist = [],
        gotImpl = got,
    }: IHttpConnectionOptions) {
        super(Core.getTransport(transport), Core.getProtocol(protocol))
        this.requestOptions = Object.freeze(
            filterHeaders(
                { responseType: 'buffer', ...requestOptions },
                headerBlacklist,
            ),
        )
        this.port = port
        this.hostName = hostName
        this.path = Core.normalizePath(path || DEFAULT_PATH)
        this.protocol = https === true ? 'https' : 'http'
        this.serviceName = serviceName
        this.basePath = `${this.protocol}://${this.hostName}:${this.port}`
        this.withEndpointPerMethod = withEndpointPerMethod
        this.url = `${this.basePath}${this.path}`
        this.filters = []
        this.gotImpl = gotImpl
    }

    public register(
        ...filters: Array<
            IThriftClientFilterConfig<RequestOptions>
        >
    ): void {
        filters.forEach(
            (
                next: IThriftClientFilterConfig<
                    RequestOptions
                >,
            ) => {
                this.filters.push({
                    methods: next.methods || [],
                    handler: next.handler,
                })
            },
        )
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

        const filters: Array<RequestHandler<
            RequestOptions
        >> = this.filtersForMethod(requestMethod)

        const thriftRequest: IThriftRequest<Partial<
            OptionsOfBufferResponseBody
        >> = {
            data: dataToSend,
            methodName: requestMethod,
            uri: this.url,
            context,
        }

        return applyFilters(
            thriftRequest,
            filters,
            (
                finalRequest: IThriftRequest<
                    RequestOptions
                >,
            ): Promise<IRequestResponse> => {
                return this.write(
                    finalRequest.data,
                    finalRequest.methodName,
                    finalRequest.context,
                )
            },
        ).then(
            (res: IRequestResponse): Buffer => {
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
        const requestOptions: OptionsOfBufferResponseBody = Core.overlayObjects(
            this.requestOptions,
            options,
            {
                method: 'POST',
                body: dataToWrite,
                url: requestUrl,
                headers: {
                    'Content-Length': dataToWrite.length.toString(),
                    'Content-Type': 'application/octet-stream',
                },
            } as RequestOptions,
        )

        return this.gotImpl(requestOptions)
            .then((response) => {
                if (isErrorResponse(response)) {
                    throw response
                }
                return {
                    statusCode: response.statusCode,
                    headers: response.headers,
                    body: response.rawBody,
                }
            })
            .catch((err) => {
                if (err instanceof HTTPError) {
                    if (
                        shouldRetry(
                            err.response,
                            retry,
                            this.withEndpointPerMethod,
                        )
                    ) {
                        return this.write(
                            dataToWrite,
                            methodName,
                            options,
                            true,
                        )
                    }
                }
                throw err
            })
    }

    private filtersForMethod(
        name: string,
    ): Array<RequestHandler<RequestOptions>> {
        return this.filters
            .filter(filterByMethod<RequestOptions>(name))
            .map(
                (
                    filter: IThriftClientFilter<
                        RequestOptions
                    >,
                ) => filter.handler,
            )
    }
}
