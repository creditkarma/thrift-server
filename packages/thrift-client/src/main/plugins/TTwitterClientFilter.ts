import {
    getProtocol,
    getTracerForService,
    getTransport,
    IProtocolConstructor,
    IRequestContext,
    ITransportConstructor,
    MessageType,
    ProtocolType,
    TProtocol,
    TransportType,
    TTransport,
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

import * as TTwitter from '../../ttwitter/com/twitter/finagle/thrift/thrift/tracing'

import * as logger from '../logger'

// Exported generated Twitter types...
export { TTwitter }

export interface IClientId {
    name: string
}

export interface ITTwitterFileterOptions {
    localServiceName: string
    remoteServiceName: string
    destHeader?: string
    isUpgraded?: boolean
    clientId?: IClientId
    transportType?: TransportType,
    protocolType?: ProtocolType,
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
}

const CAN_TRACE_METHOD_NAME: string = '__can__finagle__trace__v3__'

function readRequestContext(context: any, tracer: Tracer): IRequestContext {
    if (context !== undefined && context.traceId !== undefined) {
        return {
            traceId: context.traceId,
            usesLinkerd: false,
            requestHeaders: {},
        }

    } else {
        const traceId: TraceId = tracer.createRootId()
        return {
            traceId,
            usesLinkerd: false,
            requestHeaders: {},
        }
    }
}

function upgradeRequest(
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Buffer {
    const Transport: ITransportConstructor = getTransport(transportType)
    const Protocol: IProtocolConstructor = getProtocol(protocolType)
    const options: TTwitter.ConnectionOptions = new TTwitter.ConnectionOptions()
    const writer: TTransport = new Transport()
    const output: TProtocol = new Protocol(writer)

    output.writeMessageBegin(CAN_TRACE_METHOD_NAME, MessageType.CALL, 0)
    options.write(output)
    output.writeMessageEnd()

    return output.flush()
}

export function TTwitterClientFilter<T>({
    localServiceName,
    remoteServiceName,
    destHeader = remoteServiceName,
    isUpgraded = true,
    clientId,
    debug = false,
    endpoint,
    sampleRate,
    transportType = 'buffered',
    protocolType = 'binary',
    httpInterval,
}: ITTwitterFileterOptions): IThriftMiddlewareConfig<T> {
    let hasUpgraded: boolean = false
    let upgradeRequested: boolean = false

    return {
        async handler(dataToSend: Buffer, context: T, next: NextFunction<T>): Promise<IRequestResponse> {
            if (isUpgraded) {
                function sendUpgradedRequest(): Promise<IRequestResponse> {
                    logger.log('TTwitter upgraded')
                    const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, httpInterval })
                    const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName })
                    const requestContext: IRequestContext = readRequestContext(context, tracer)
                    tracer.setId(requestContext.traceId)

                    return tracer.scoped(() => {
                        const { headers } = instrumentation.recordRequest({ headers: {} }, '', 'post')
                        const requestHeader: TTwitter.RequestHeader = new TTwitter.RequestHeader({
                            trace_id: ((headers as any)[ZipkinHeaders.TraceId]),
                            span_id: ((headers as any)[ZipkinHeaders.SpanId]),
                            parent_span_id: ((headers as any)[ZipkinHeaders.ParentId]),
                            sampled: ((headers as any)[ZipkinHeaders.Sampled] === '1'),
                            client_id: (clientId !== undefined) ? new TTwitter.ClientId(clientId) : undefined,
                            contexts: [],
                            dest: destHeader,
                            delegations: [],
                        })

                        return appendThriftObject(requestHeader, dataToSend, transportType, protocolType).then((extended: Buffer) => {
                            return next(extended, context).then((res: IRequestResponse): Promise<IRequestResponse> => {
                                return readThriftObject<TTwitter.RequestHeader>(
                                    res.body,
                                    TTwitter.ResponseHeader,
                                    transportType,
                                    protocolType,
                                ).then((result: [TTwitter.ResponseHeader, Buffer]) => {
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
                }

                if (hasUpgraded) {
                    return sendUpgradedRequest()

                } else if (upgradeRequested) {
                    return next(dataToSend, context)

                } else {
                    logger.log('Requesting TTwitter upgrade')
                    upgradeRequested = true
                    return next(upgradeRequest(), context).then((upgradeResponse: IRequestResponse) => {
                        hasUpgraded = true
                        return sendUpgradedRequest()

                    }, (err: any) => {
                        logger.log('Downgrading TTwitter request: ', err)
                        return next(dataToSend, context)
                   })
                }

            } else {
                return next(dataToSend, context)
            }
        },
    }
}
