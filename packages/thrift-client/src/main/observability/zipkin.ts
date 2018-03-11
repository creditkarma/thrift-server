import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    addL5Dheaders,
    asyncScope,
    containsZipkinHeaders,
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

function applyL5DHeaders(incomingHeaders: IRequestHeaders, headers: IRequestHeaders): IRequestHeaders {
    if (hasL5DHeader(incomingHeaders)) {
        return addL5Dheaders(headers)
    } else {
        return headers
    }
}

function readRequestContext(context: ThriftContext<CoreOptions>, tracer: Tracer): IRequestContext {
    if (context.request && containsZipkinHeaders(context.request.headers)) {
        return {
            traceId: traceIdForHeaders(context.request.headers),
            requestHeaders: context.request.headers,
        }
    } else {
        const asyncContext: IRequestContext | null = asyncScope.get<IRequestContext>('requestContext')
        if (asyncContext !== null) {
            return asyncContext

        } else {
            return {
                traceId: tracer.createRootId(),
                requestHeaders: {},
            }
        }
    }
}

export function zipkinClientMiddleware({
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
            const requestContext: IRequestContext | null = readRequestContext(context, tracer)
            const traceId: TraceId = requestContext.traceId
            const incomingHeaders: IRequestHeaders = requestContext.requestHeaders
            tracer.setId(traceId)

            return tracer.scoped(() => {
                const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
                let { headers } = instrumentation.recordRequest({ headers: {} }, '', 'post')
                headers = applyL5DHeaders(incomingHeaders, headers)

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
