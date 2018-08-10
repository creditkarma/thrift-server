import {
    getTracerForService,
    headersForTraceId,
    IRequestHeaders,
    IZipkinPluginOptions,
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
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next: (err?: Error) => void) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, headers, httpInterval, httpTimeout })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onRequest', (request, reply) => {
                console.log('headers 1: ', request.headers)
                const requestHeaders = request.headers

                tracer.scoped(() => {
                    const traceId: TraceId = instrumentation.recordRequest(
                        request.method,
                        url.format(request.url),
                        (header: string): option.IOption<any> => {
                            const val = requestHeaders[header.toLowerCase()]
                            if (val !== null && val !== undefined) {
                                return new option.Some(val)

                            } else {
                                return option.None
                            }
                        },
                    ) as any as TraceId // Nasty but this method is incorrectly typed

                    const zipkinHeaders: IRequestHeaders = headersForTraceId(traceId)

                    request.headers = Object.assign({}, request.headers, zipkinHeaders)
                    request.plugins.zipkin = traceId

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const statusCode = readStatusCode(request)
                const traceId: any = request.plugins.zipkin

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
