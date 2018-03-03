import {
    getTracerForService,
    IZipkinPluginOptions,
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
    serviceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
}: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next) {
            const tracer = getTracerForService(serviceName, { debug, endpoint, sampleRate })
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })

            server.ext('onRequest', (request, reply) => {
                console.log('zipkin request hapi')
                const { headers } = request
                const plugins = request.plugins

                tracer.scoped(() => {
                    const traceId = instrumentation.recordRequest(
                        request.method,
                        url.format(request.url),
                        (header: string): option.IOption<any> => {
                            const val = headers[header.toLowerCase()]
                            if (val != null) {
                                return new option.Some(val)
                            } else {
                                return option.None
                            }
                        },
                    )

                    plugins.zipkin = { traceId }

                    return reply.continue()
                })
            })

            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const statusCode = readStatusCode(request)

                tracer.scoped(() => {
                    instrumentation.recordResponse(request.plugins.zipkin.traceId, `${statusCode}`)
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
