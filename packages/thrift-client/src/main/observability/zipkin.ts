import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    addL5Dheaders,
    asyncScope,
    getTracerForService,
    hasL5DHeader,
    IRequestContext,
    IRequestHeaders,
    IZipkinPluginOptions,
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

export function ZipkinTracePlugin({
    localServiceName,
    remoteServiceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
}: IZipkinPluginOptions): IThriftMiddleware<CoreOptions> {
    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate })
            const requestContext: IRequestContext | null = asyncScope.get<IRequestContext>('requestContext')
            console.log('clieant: lineage: ', asyncScope.lineage())
            console.log('client: requestContext: ', requestContext)
            if (requestContext !== null) {
                const traceId: TraceId = requestContext.traceId
                const incomingHeaders: IRequestHeaders = requestContext.requestHeaders
                tracer.setId(traceId)
                return tracer.scoped(() => {
                    const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
                    console.log(`client: recordRequest[${localServiceName}]: `, incomingHeaders)
                    let { headers } = instrumentation.recordRequest({ headers: {} }, '', 'post')
                    headers = applyL5DHeaders(incomingHeaders, headers)

                    return next(data, { headers }).then((res: IRequestResponse) => {
                        tracer.scoped(() => {
                            console.log(`client: recordResponse[${localServiceName}]`)
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
            } else {
                return next()
            }
        },
    }
}
