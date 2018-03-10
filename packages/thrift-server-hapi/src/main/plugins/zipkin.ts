import {
    asyncScope,
    getTracerForService,
    IZipkinPluginOptions,
    normalizeHeaders,
} from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'
import * as url from 'url'
import { Instrumentation, option } from 'zipkin'

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

export function zipkinPlugin({
    localServiceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next) {
            const tracer = getTracerForService(localServiceName, { debug, endpoint, sampleRate })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onRequest', (request, reply) => {
                (request.headers as any) = normalizeHeaders(request.headers)
                const plugins = request.plugins

                tracer.scoped(() => {
                    console.log(`hapi: recordRequest[${localServiceName}]: `, request.headers)
                    const traceId = instrumentation.recordRequest(
                        request.method,
                        url.format(request.url),
                        (header: string): option.IOption<any> => {
                            const val = request.headers[header.toLowerCase()]
                            if (val !== null && val !== undefined) {
                                return new option.Some(val)
                            } else {
                                return option.None
                            }
                        },
                    )

                    plugins.zipkin = { traceId }
                    console.log('hapi: lineage: ', asyncScope.lineage())
                    asyncScope.set('requestContext', {
                        traceId,
                        requestHeaders: request.headers,
                    })

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const statusCode = readStatusCode(request)

                tracer.scoped(() => {
                    const traceId: any = request.plugins.zipkin.traceId
                    console.log(`hapi: recordResponse[${localServiceName}]`)
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
