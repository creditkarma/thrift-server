import * as Hapi from 'hapi'
import * as url from 'url'
import { Instrumentation, option, Tracer } from 'zipkin'

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

export interface IZipkinPluginOptions {
    tracer: Tracer
    port: number
}

export function HapiZipkinPlugin({ tracer, port = 0 }: IZipkinPluginOptions): Hapi.PluginRegistrationObject<never> {
    const zipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server, never, next) {
            const instrumentation = new Instrumentation.HttpServer({ tracer, port })
            if (tracer == null) {
                next(new Error('No tracer specified'))
                return
            }

            server.ext('onRequest', (request, reply) => {
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

                    console.log('traceId: ', traceId)

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

    zipkinPlugin.register.attributes = pkg

    return zipkinPlugin
}
