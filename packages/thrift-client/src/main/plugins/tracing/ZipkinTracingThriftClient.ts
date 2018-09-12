import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import { CoreOptions } from 'request'

import {
    addL5Dheaders,
    containsZipkinHeaders,
    defaultErrorLogger,
    getTracerForService,
    hasL5DHeader,
    IRequestContext,
    IRequestHeaders,
    IZipkinPluginOptions,
    traceIdForHeaders,
} from '@creditkarma/thrift-server-core'

import {
    IRequestResponse,
    IThriftMiddleware,
    NextFunction,
    ThriftContext,
} from '../../types'

function applyL5DHeaders(requestContext: IRequestContext, headers: IRequestHeaders): IRequestHeaders {
    if (requestContext.usesLinkerd) {
        return addL5Dheaders(headers)

    } else {
        return headers
    }
}

function readRequestContext(
    thriftContext: ThriftContext<CoreOptions>,
    tracer: Tracer,
): IRequestContext {
    if (thriftContext.request && containsZipkinHeaders(thriftContext.request.headers)) {
        const traceId: TraceId = traceIdForHeaders(thriftContext.request.headers)
        return {
            traceId,
            usesLinkerd: hasL5DHeader(thriftContext.request.headers),
            requestHeaders: thriftContext.request.headers,
        }

    } else {
        const traceId: TraceId = thriftContext.traceId || tracer.createRootId()
        return {
            traceId,
            usesLinkerd: false,
            requestHeaders: {},
        }
    }
}

export function ZipkinTracingThriftClient({
    localServiceName,
    remoteServiceName,
    debug = false,
    endpoint,
    sampleRate,
    httpInterval,
    httpTimeout,
    headers,
    eventLoggers = { error: defaultErrorLogger },
}: IZipkinPluginOptions): IThriftMiddleware<CoreOptions> {
    const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, httpInterval, httpTimeout, headers, eventLoggers })
    const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })

    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const requestContext: IRequestContext = readRequestContext(context, tracer)
            tracer.setId(requestContext.traceId)

            return tracer.scoped(() => {
                let { headers: requestHeaders } = instrumentation.recordRequest(
                    { headers: {} },
                    context.uri || '',
                    context.methodName || '',
                )
                requestHeaders = applyL5DHeaders(requestContext, requestHeaders)

                return next(data, { headers: requestHeaders }).then((res: IRequestResponse) => {
                    tracer.scoped(() => {
                        instrumentation.recordResponse(
                            (requestContext.traceId as any),
                            `${res.statusCode}`,
                        )
                    })

                    return res

                }, (err: any) => {
                    tracer.scoped(() => {
                        instrumentation.recordError((requestContext.traceId as any), err)
                    })

                    return Promise.reject(err)
                })
            })
        },
    }
}
