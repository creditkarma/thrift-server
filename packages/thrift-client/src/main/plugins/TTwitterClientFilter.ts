import {
    getAsyncScope,
    getTracerForService,
    IRequestContext,
    ProtocolType,
    TransportType,
    ZipkinHeaders,
} from '@creditkarma/thrift-server-core'

import {
    Instrumentation,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    IRequestResponse,
    IThriftMiddlewareConfig,
    NextFunction,
} from '../types'

import {
    appendThriftObject,
} from './appendThriftObject'

import {
    readThriftObject,
} from './readThriftObject'

import {
    ClientId,
    RequestHeader,
    ResponseHeader,
} from '../../ttwitter/com/twitter/finagle/thrift/thrift/tracing'

import * as logger from '../logger'

export interface IClientId {
    name: string
}

export interface ITTwitterFileterOptions {
    localServiceName: string
    remoteServiceName: string
    isUpgraded?: boolean
    clientId?: IClientId
    transportType?: TransportType,
    protocolType?: ProtocolType,
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
}

function readRequestContext(tracer: Tracer): IRequestContext {
    const asyncContext: IRequestContext | null = getAsyncScope().get<IRequestContext>('requestContext')
    if (asyncContext !== null) {
            return asyncContext

        } else {
            const traceId: TraceId = tracer.createRootId()
            return {
                traceId,
                usesLinkerd: false,
                requestHeaders: {},
            }
        }
}

export function TTwitterClientFilter<T>({
    localServiceName,
    remoteServiceName,
    isUpgraded = true,
    clientId,
    debug = false,
    endpoint,
    sampleRate,
    transportType = 'buffered',
    protocolType = 'binary',
}: ITTwitterFileterOptions): IThriftMiddlewareConfig<T> {
    return {
        async handler(data: Buffer, context: T, next: NextFunction<T>): Promise<IRequestResponse> {
            if (isUpgraded) {
                const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate })
                const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
                const requestContext: IRequestContext = readRequestContext(tracer)
                tracer.setId(requestContext.traceId)

                return tracer.scoped(() => {
                    const { headers } = instrumentation.recordRequest({ headers: {} }, '', 'post')

                    const requestHeader: RequestHeader = new RequestHeader({
                        trace_id: ((headers as any)[ZipkinHeaders.TraceId]),
                        span_id: ((headers as any)[ZipkinHeaders.SpanId]),
                        parent_span_id: ((headers as any)[ZipkinHeaders.ParentId]),
                        sampled: ((headers as any)[ZipkinHeaders.Sampled] === '1'),
                        client_id: (clientId !== undefined) ? new ClientId(clientId) : undefined,
                        contexts: [],
                        delegations: [],
                    })

                    return appendThriftObject(requestHeader, data, transportType, protocolType).then((extended: Buffer) => {
                        return next(extended, context).then((res: IRequestResponse): Promise<IRequestResponse> => {
                            return readThriftObject(
                                res.body,
                                ResponseHeader,
                                transportType,
                                protocolType,
                            ).then((result: [ResponseHeader, Buffer]) => {
                                return {
                                    statusCode: res.statusCode,
                                    headers: {
                                        thriftContext: result[0],
                                    },
                                    body: result[1],
                                }
                            }, (err: any) => {
                                logger.warn(`Error reading context from Thrift response: `, err)
                                return res
                            })
                        })
                    })
                })
            } else {
                return next(data, context)
            }
        },
    }
}
