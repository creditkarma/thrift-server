import {
    getContextForService,
    getTracerForService,
    hasL5DHeader,
    IRequestContext,
    IZipkinPluginOptions,
    normalizeHeaders,
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
<<<<<<< HEAD:packages/thrift-server-hapi/src/main/observability/zipkin.ts
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<undefined> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<undefined> = {
        register(server: Hapi.Server, nothing: undefined, next) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate })
=======
    httpInterval,
    asyncOptions,
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next: (err?: Error) => void) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate, httpInterval, asyncOptions })
>>>>>>> master:packages/thrift-server-hapi/src/main/observability/ZipkinTracingHapi.ts
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onRequest', (request, reply) => {
                const normalizedHeaders = normalizeHeaders(request.headers)
                const plugins = request.plugins

                tracer.scoped(() => {
                    const traceId: TraceId = instrumentation.recordRequest(
                        request.method,
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

                    const requestContext: IRequestContext = {
                        traceId,
                        usesLinkerd: hasL5DHeader(normalizedHeaders),
                        requestHeaders: normalizedHeaders,
                    }

                    plugins.zipkin = requestContext

                    getContextForService(localServiceName).setValue('requestContext', requestContext)

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const statusCode = readStatusCode(request)

                tracer.scoped(() => {
                    const traceId: any = request.plugins.zipkin.traceId
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
