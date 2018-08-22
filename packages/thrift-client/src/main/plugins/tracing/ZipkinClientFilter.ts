import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import { CoreOptions } from 'request'

import {
    addL5Dheaders,
    containsZipkinHeaders,
    formatUrl,
    getTracerForService,
    hasL5DHeader,
    IRequestContext,
    IRequestHeaders,
    IZipkinClientOptions,
    traceIdForHeaders,
} from '@creditkarma/thrift-server-core'

import {
    IRequest,
    IRequestResponse,
    IThriftClientFilter,
    IThriftRequest,
    NextFunction,
} from '../../types'

function applyL5DHeaders(requestHeaders: IRequestHeaders, headers: IRequestHeaders): IRequestHeaders {
    if (hasL5DHeader(requestHeaders)) {
        return addL5Dheaders(headers)

    } else {
        return headers
    }
}

function readRequestContext(
    requestHeaders: IRequestHeaders,
    tracer: Tracer,
): IRequestContext {
    if (containsZipkinHeaders(requestHeaders)) {
        return {
            traceId: traceIdForHeaders(requestHeaders),
            headers: requestHeaders,
        }

    } else {
        return {
            traceId: tracer.createRootId(),
            headers: {},
        }
    }
}

function readRequestHeaders(request: IThriftRequest<CoreOptions>): IRequestHeaders {
    if (request.context && request.context.headers) {
        return request.context.headers

    } else {
        return {}
    }
}

export function ZipkinClientFilter<Context extends IRequest>({
    localServiceName,
    remoteServiceName,
    debug = false,
    endpoint,
    headers,
    sampleRate,
    httpInterval,
    httpTimeout,
}: IZipkinClientOptions): IThriftClientFilter<CoreOptions> {
    const serviceName: string = remoteServiceName || localServiceName
    const tracer: Tracer = getTracerForService(serviceName, { debug, endpoint, headers, sampleRate, httpInterval, httpTimeout })
    const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })

    return {
        methods: [],
        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const requestHeaders: IRequestHeaders = readRequestHeaders(request)
            const requestContext: IRequestContext = readRequestContext(requestHeaders, tracer)
            tracer.setId(requestContext.traceId)

            return tracer.scoped(() => {
                const updatedHeaders: IRequestHeaders = instrumentation.recordRequest(
                    { headers: {} },
                    formatUrl(request.uri),
                    (request.methodName || ''),
                ).headers

                const traceId: TraceId = tracer.id
                const withLD5Headers: IRequestHeaders = applyL5DHeaders(requestHeaders, updatedHeaders)

                return next(request.data, { headers: withLD5Headers }).then((res: IRequestResponse) => {
                    instrumentation.recordResponse((traceId as any), `${res.statusCode}`)
                    return res

                }, (err: any) => {
                    instrumentation.recordError((traceId as any), err)
                    return Promise.reject(err)
                })
            })
        },
    }
}
