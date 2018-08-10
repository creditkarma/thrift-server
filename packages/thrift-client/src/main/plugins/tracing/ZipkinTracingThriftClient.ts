import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import { CoreOptions } from 'request'

import {
    containsZipkinHeaders,
    getTracerForService,
    IRequestContext,
    IZipkinPluginOptions,
    traceIdForHeaders,
} from '@creditkarma/thrift-server-core'

import {
    IRequestResponse,
    IThriftMiddleware,
    NextFunction,
    ThriftContext,
} from '../../types'

function readRequestContext(
    requestContext: any,
    tracer: Tracer,
): IRequestContext {
    if (requestContext.request && containsZipkinHeaders(requestContext.request.headers)) {
        const traceId: TraceId = traceIdForHeaders(requestContext.request.headers)
        return {
            traceId,
            requestHeaders: requestContext.request.headers,
        }

    } else if (requestContext.headers && containsZipkinHeaders(requestContext.headers)) {
        const traceId: TraceId = traceIdForHeaders(requestContext.headers)
        return {
            traceId,
            requestHeaders: requestContext.headers,
        }

    } else {
        const traceId: TraceId = requestContext.traceId || tracer.createRootId()
        return {
            traceId,
            requestHeaders: {},
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
    httpInterval,
    httpTimeout,
}: IZipkinPluginOptions): IThriftMiddleware<CoreOptions> {
    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, headers, sampleRate, httpInterval, httpTimeout })
            const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
            const requestContext: IRequestContext = readRequestContext(context, tracer)
            tracer.setId(requestContext.traceId)

            return tracer.scoped(() => {
                const requestHeaders = instrumentation.recordRequest({ headers: {} }, 'hi there', 'post')

                return next(data, requestHeaders).then((res: IRequestResponse) => {
                    tracer.scoped(() => {
                        instrumentation.recordResponse((requestContext.traceId as any), `${res.statusCode}`)
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
