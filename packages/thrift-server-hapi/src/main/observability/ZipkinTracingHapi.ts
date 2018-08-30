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

const pkg: any = require('../../../package.json')

function readStatusCode({ response }: Hapi.Request): number {
    if (response !== null) {
        if (response.isBoom && response.output !== undefined) {
            return response.output.statusCode
        } else {
            return response.statusCode
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
}: IZipkinOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next: (err?: Error) => void) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, headers, httpInterval, httpTimeout })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onPostAuth', (request, reply) => {
                const requestMethod: string = readThriftMethod(
                    request.payload,
                    getTransport(transport),
                    getProtocol(protocol)
                )
                const normalHeaders = normalizeHeaders(request.headers)

                tracer.scoped(() => {
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

                    const updatedHeaders: IRequestHeaders = deepMerge(normalHeaders, traceHeaders)

                    request.headers = updatedHeaders

                    request.plugins.zipkin = { traceId }

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const statusCode = readStatusCode(request)
                const traceId: any = request.plugins.zipkin.traceId

                tracer.scoped(() => {
                    instrumentation.recordResponse(traceId, `${statusCode}`)
                })

                return reply.continue()
            })

            next()
        },
    }

    hapiZipkinPlugin.register.attributes = {
        name: 'hapi-zipkin-plugin',
        version: pkg.version,
    }

    return hapiZipkinPlugin
}
