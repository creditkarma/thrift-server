import {
    deepMerge,
    formatUrl,
    getProtocol,
    getTracerForService,
    getTransport,
    headersForTraceId,
    IRequestHeaders,
    IZipkinOptions,
    normalizeHeaders,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import * as Hapi from 'hapi'
import * as url from 'url'
import {
    Instrumentation,
    option,
    TraceId,
} from 'zipkin'

import * as Boom from 'boom'
import { ThriftHapiPlugin } from '../types'

const pkg: any = require('../../../package.json')

function isBoom(obj: any): obj is Boom {
    return obj.isBoom
}

function readStatusCode({ response }: Hapi.Request): number {
    if (response !== null) {
        if (isBoom(response) && response.output !== undefined) {
            return response.output.statusCode

        } else if (!isBoom(response)) {
            return response.statusCode

        } else {
            return 500
        }
    } else {
        return 500
    }
}

export function ZipkinTracingHapi({
    localServiceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
    headers,
    httpInterval,
    httpTimeout,
    transport = 'buffered',
    protocol = 'binary',
    zipkinVersion,
    logger,
}: IZipkinOptions): ThriftHapiPlugin {
    return {
        name: 'hapi-zipkin-plugin',
        version: pkg.version,
        async register(server: Hapi.Server, nothing: void): Promise<void> {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, headers, httpInterval, httpTimeout, zipkinVersion, logger })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onPreHandler', (request, reply) => {
                const requestMethod: string = readThriftMethod(
                    (request.payload as Buffer),
                    getTransport(transport),
                    getProtocol(protocol),
                )

                const normalHeaders: IRequestHeaders = normalizeHeaders(request.headers)

                return tracer.scoped(() => {
                    const traceId: TraceId = instrumentation.recordRequest(
                        (requestMethod || request.method),
                        formatUrl(url.format(request.url)),
                        (header: string): option.IOption<any> => {
                            const val = normalHeaders[header.toLowerCase()]
                            if (val !== null && val !== undefined) {
                                return new option.Some(val)

                            } else {
                                return option.None
                            }
                        },
                    ) as any as TraceId // Nasty but this method is incorrectly typed

                    const traceHeaders: IRequestHeaders = headersForTraceId(traceId)

                    const updatedHeaders: IRequestHeaders = deepMerge(normalHeaders, traceHeaders);

                    (request as any).headers = updatedHeaders;

                    (request.plugins as any).zipkin = { traceId }

                    return reply.continue
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                const statusCode = readStatusCode(request)
                const traceId: any = (request.plugins as any).zipkin.traceId

                tracer.scoped(() => {
                    instrumentation.recordResponse(traceId, `${statusCode}`)
                })

                return reply.continue
            })
        },
    }
}
