import {
    getProtocol,
    getTracerForService,
    getTransport,
    hasL5DHeader,
    IZipkinPluginOptions,
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
    httpInterval,
    httpTimeout,
    headers,
    transport = 'buffered',
    protocol = 'binary',
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next: (err?: Error) => void) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, httpInterval, httpTimeout, headers })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onPostAuth', (request, reply) => {
                const methodName: string = readThriftMethod(
                    request.payload,
                    getTransport(transport),
                    getProtocol(protocol),
                )

                const normalizedHeaders = normalizeHeaders(request.headers)

                tracer.scoped(() => {
                    const traceId: TraceId = instrumentation.recordRequest(
                        (methodName || request.method),
                        url.format(request.url),
                        (header: string): option.IOption<any> => {
                            const val = normalizedHeaders[header.toLowerCase()]
                            if (val !== null && val !== undefined) {
                                return new option.Some(val)

                            } else {
                                return option.None
                            }
                        },
                    ) as any as TraceId // Nasty but this method is incorrectly typed

                    request.plugins.zipkin = {
                        traceId,
                        usesLinkerd: hasL5DHeader(normalizedHeaders),
                        requestHeaders: normalizedHeaders,
                    }

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                if (request.plugins.zipkin && request.plugins.zipkin.traceId) {
                    const statusCode = readStatusCode(request)
                    const traceId: any = request.plugins.zipkin.traceId

                    tracer.scoped(() => {
                        instrumentation.recordResponse(traceId, `${statusCode}`)
                    })
                }

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
