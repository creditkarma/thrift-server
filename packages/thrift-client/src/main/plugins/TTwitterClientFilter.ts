import {
    formatUrl,
    getProtocol,
    getTracerForService,
    getTransport,
    Int64,
    IProtocolConstructor,
    IRequestContext,
    ITransportConstructor,
    LogFunction,
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
    IThriftClientFilterConfig,
    IThriftRequest,
    NextFunction,
} from '../types'

import {
    appendThriftObject,
} from './appendThriftObject'

import {
    readThriftObject,
} from './readThriftObject'

import * as TTwitter from '../../ttwitter/com/creditkarma/finagle/thrift'

import { defaultLogger } from '../logger'

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
    logger?: LogFunction
}

const CAN_TRACE_METHOD_NAME: string = '__can__finagle__trace__v3__'

function readRequestContext(context: any, tracer: Tracer): IRequestContext {
    if (context !== undefined && context.traceId !== undefined) {
        return {
            traceId: context.traceId,
            headers: {},
        }

    } else {
        const traceId: TraceId = tracer.createRootId()
        return {
            traceId,
            headers: {},
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
    logger = defaultLogger,
}: ITTwitterFileterOptions): IThriftClientFilterConfig<T> {
    let hasUpgraded: boolean = false
    let upgradeRequested: boolean = false

    return {
        async handler(request: IThriftRequest<T>, next: NextFunction<T>): Promise<IRequestResponse> {
            if (isUpgraded) {
                function sendUpgradedRequest(): Promise<IRequestResponse> {
                    logger([ 'info' ], 'TTwitter upgraded')
                    const tracer: Tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, httpInterval })
                    const instrumentation = new Instrumentation.HttpClient({ tracer, serviceName: localServiceName, remoteServiceName })
                    const requestContext: IRequestContext = readRequestContext(request, tracer)
                    tracer.setId(requestContext.traceId)

                    return tracer.scoped(() => {
                        const { headers }: any = instrumentation.recordRequest(
                            { headers: {} },
                            formatUrl(request.uri),
                            (request.methodName || 'post'),
                        )

                        const normalHeaders: any = Object.keys(headers).reduce((acc: any, name: string) => {
                            acc[name.toLowerCase()] = headers[name]
                            return acc
                        }, {})

                        const requestHeader: TTwitter.IRequestHeader = {
                            trace_id: new Int64(`0x${(normalHeaders as any)[ZipkinHeaders.TraceId]}`),
                            span_id: new Int64(`0x${(normalHeaders as any)[ZipkinHeaders.SpanId]}`),
                            parent_span_id: (
                                (normalHeaders[ZipkinHeaders.ParentId] !== undefined) ?
                                    new Int64(`0x${(normalHeaders as any)[ZipkinHeaders.ParentId]}`) :
                                    undefined
                            ),
                            sampled: ((normalHeaders as any)[ZipkinHeaders.Sampled] === '1'),
                            client_id: (clientId !== undefined) ? new TTwitter.ClientId(clientId) : undefined,
                            contexts: [],
                            dest: destHeader,
                            delegations: [],
                        }

                        return appendThriftObject<TTwitter.IResponseHeaderArgs>(
                            requestHeader,
                            request.data,
                            TTwitter.RequestHeaderCodec,
                            transportType,
                            protocolType,
                        ).then((extended: Buffer) => {
                            return next(extended, request.context).then((res: IRequestResponse): Promise<IRequestResponse> => {
                                return readThriftObject<TTwitter.IResponseHeader>(
                                    res.body,
                                    TTwitter.ResponseHeaderCodec,
                                    transportType,
                                    protocolType,
                                ).then((result: [TTwitter.IResponseHeader, Buffer]) => {
                                    return {
                                        statusCode: res.statusCode,
                                        headers: {
                                            thriftContext: result[0],
                                        },
                                        body: result[1],
                                    }
                                }, (err: any) => {
                                    logger([ 'warn' ], `Error reading context from Thrift response: ${err.message}`)
                                    return res
                                })
                            })
                        })
                    })
                }

                if (hasUpgraded) {
                    return sendUpgradedRequest()

                } else if (upgradeRequested) {
                    return next(request.data, request.context)

                } else {
                    logger([ 'info' ], 'Requesting TTwitter upgrade')
                    upgradeRequested = true
                    return next(upgradeRequest(), request.context).then((upgradeResponse: IRequestResponse) => {
                        hasUpgraded = true
                        return sendUpgradedRequest()

                    }, (err: any) => {
                        logger([ 'info' ], `Downgrading TTwitter request: ${err.message}`)
                        return next(request.data, request.context)
                   })
                }

            } else {
                return next(request.data, request.context)
            }
        },
    }
}
