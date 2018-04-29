import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    addL5Dheaders,
    containsZipkinHeaders,
    getAsyncScope,
    getTracerForService,
    hasL5DHeader,
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
} from '../types'

function applyL5DHeaders(requestContext: IRequestContext, headers: IRequestHeaders): IRequestHeaders {
    if (requestContext.usesLinkerd) {
        return addL5Dheaders(headers)

    } else {
        return headers
    }
}

function readRequestContext(context: ThriftContext<CoreOptions>, tracer: Tracer): IRequestContext {
    if (context.request && containsZipkinHeaders(context.request.headers)) {
        const traceId: TraceId = traceIdForHeaders(context.request.headers)
        tracer.setId(traceId)
        return {
            traceId,
            usesLinkerd: hasL5DHeader(context.request.headers),
            requestHeaders: context.request.headers,
        }

    } else {
        const asyncContext: IRequestContext | null = getAsyncScope().get<IRequestContext>('requestContext')
        if (asyncContext !== null) {
            return asyncContext

        } else {
            return {
                traceId: tracer.createRootId(),
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
    sampleRate,
}: IZipkinPluginOptions): IThriftMiddleware<CoreOptions> {
    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate })
            const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
            const requestContext: IRequestContext = readRequestContext(context, tracer)

            return tracer.scoped(() => {
                const traceId: TraceId = tracer.id
                let { headers } = instrumentation.recordRequest({ headers: {} }, '', 'post')
                headers = applyL5DHeaders(requestContext, headers)

                return next(data, { headers }).then((res: IRequestResponse) => {
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
