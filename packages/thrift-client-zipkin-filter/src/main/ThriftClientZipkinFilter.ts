import { Instrumentation, TraceId, Tracer } from 'zipkin'

import {
    formatUrl,
    IRequestContext,
    IRequestHeaders,
    LogFunction,
} from '@creditkarma/thrift-server-core'

import {
    IRequest,
    IRequestResponse,
    IThriftClientFilter,
    IThriftRequest,
    NextFunction,
    RequestOptions,
} from '@creditkarma/thrift-client'

import {
    addL5Dheaders,
    containsZipkinHeaders,
    getTracerForService,
    hasL5DHeader,
    IZipkinClientOptions,
    traceIdForHeaders,
    traceIdFromTraceId,
} from '@creditkarma/zipkin-core'

function applyL5DHeaders(
    requestHeaders: IRequestHeaders,
    headers: IRequestHeaders,
): IRequestHeaders {
    if (hasL5DHeader(requestHeaders)) {
        return addL5Dheaders(headers)
    } else {
        return headers
    }
}

function readRequestContext(
    requestHeaders: IRequestHeaders,
    tracer: Tracer,
    logger?: LogFunction,
): IRequestContext {
    if (containsZipkinHeaders(requestHeaders)) {
        return {
            traceId: traceIdForHeaders(requestHeaders),
            headers: requestHeaders,
            logger,
        }
    } else {
        const rootId = tracer.createRootId()
        return {
            traceId: {
                traceId: rootId.traceId,
                spanId: rootId.spanId,
                parentId: rootId.parentId,
                sampled: rootId.sampled.getOrElse(false),
            },
            headers: {},
            logger,
        }
    }
}

function readRequestHeaders(
    request: IThriftRequest<RequestOptions>,
): IRequestHeaders {
    if (request.context && request.context.headers) {
        return request.context.headers
    } else {
        return {}
    }
}

export function ThriftClientZipkinFilter<Context extends IRequest>({
    localServiceName,
    remoteServiceName,
    tracerConfig = {},
}: IZipkinClientOptions): IThriftClientFilter<RequestOptions> {
    const serviceName: string = remoteServiceName || localServiceName
    const tracer: Tracer = getTracerForService(serviceName, tracerConfig)
    const instrumentation = new Instrumentation.HttpClient({
        tracer,
        serviceName: localServiceName,
        remoteServiceName,
    })

    return {
        methods: [],
        handler(
            request: IThriftRequest<RequestOptions>,
            next: NextFunction<RequestOptions>,
        ): Promise<IRequestResponse> {
            const requestHeaders: IRequestHeaders = readRequestHeaders(request)
            const requestContext: IRequestContext = readRequestContext(
                requestHeaders,
                tracer,
                tracerConfig.logger,
            )

            if (requestContext.traceId !== undefined) {
                tracer.setId(traceIdFromTraceId(requestContext.traceId))

                return tracer.scoped(() => {
                    const updatedHeaders: IRequestHeaders = instrumentation.recordRequest(
                        { headers: {} },
                        formatUrl(request.uri),
                        request.methodName || '',
                    ).headers

                    const traceId: TraceId = tracer.id
                    const withLD5Headers: IRequestHeaders = applyL5DHeaders(
                        requestHeaders,
                        updatedHeaders,
                    )

                    return next(request.data, { headers: withLD5Headers }).then(
                        (res: IRequestResponse) => {
                            instrumentation.recordResponse(
                                traceId as any,
                                `${res.statusCode}`,
                            )
                            return res
                        },
                        (err: any) => {
                            instrumentation.recordError(traceId as any, err)
                            return Promise.reject(err)
                        },
                    )
                })
            } else {
                return next()
            }
        },
    }
}
