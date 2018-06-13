import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    addL5Dheaders,
    containsZipkinHeaders,
    getContextForService,
    getTracerForService,
    hasL5DHeader,
    IAsyncContext,
    IRequestContext,
    IRequestHeaders,
    IZipkinPluginOptions,
    traceIdForHeaders,
} from '@creditkarma/thrift-server-core'

import { CoreOptions } from 'request'

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
    asyncContext: IAsyncContext,
    thriftContext: ThriftContext<CoreOptions>,
    tracer: Tracer,
): IRequestContext {
    if (thriftContext.request && containsZipkinHeaders(thriftContext.request.headers)) {
        const traceId: TraceId = traceIdForHeaders(thriftContext.request.headers)
        tracer.setId(traceId)
        return {
            traceId,
            usesLinkerd: hasL5DHeader(thriftContext.request.headers),
            requestHeaders: thriftContext.request.headers,
        }

    } else {
        const requestContext: IRequestContext | null = asyncContext.getValue<IRequestContext>('requestContext')
        if (requestContext !== null) {
            return requestContext

        } else {
            const traceId: TraceId = tracer.createRootId()
            tracer.setId(traceId)
            return {
                traceId,
                usesLinkerd: false,
                requestHeaders: {},
            }
        }
    }
}

export function ZipkinTracingThriftClient({
    localServiceName,
    remoteServiceName,
    debug = false,
    endpoint,
    headers,
    sampleRate,
}: IZipkinPluginOptions): IThriftMiddleware<CoreOptions> {
    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, headers, sampleRate })
            const asyncContext: IAsyncContext  = getContextForService(localServiceName)
            const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
            const requestContext: IRequestContext = readRequestContext(asyncContext, context, tracer)

            return tracer.scoped(() => {
                const traceId: TraceId = tracer.id

                const requestHeaders = instrumentation.recordRequest({ headers: {} }, '', 'post')
                const withLD5headers = applyL5DHeaders(requestContext, requestHeaders.headers)

                return next(data, { headers: withLD5headers }).then((res: IRequestResponse) => {
                    tracer.scoped(() => {
                        instrumentation.recordResponse((traceId as any), `${res.statusCode}`)
                    })

                    return res

                }, (err: any) => {
                    tracer.scoped(() => {
                        instrumentation.recordError((traceId as any), err)
                    })

                    return Promise.reject(err)
                })
            })
        },
    }
}
