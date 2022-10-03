import * as Core from '@creditkarma/thrift-server-core'

import { ThriftHapiPlugin } from '@creditkarma/thrift-server-hapi'

import {
    getTracerForService,
    headersForTraceId,
    IZipkinOptions,
    normalizeHeaders,
} from '@creditkarma/zipkin-core'

import * as Hapi from '@hapi/hapi'
import * as url from 'url'
import { Instrumentation, option, TraceId } from 'zipkin'

import * as Boom from '@hapi/boom'

const pkg: any = require('../../package.json')

function isBoom(obj: any): obj is Boom.Boom {
    return obj.isBoom
}

declare module '@hapi/hapi' {
    // tslint:disable-next-line:interface-name
    export interface PluginsStates {
        zipkin: {
            traceId: TraceId
        }
    }
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
    isThrift = true,
    port = 0,
    transport = 'buffered',
    protocol = 'binary',
    tracerConfig = {},
}: IZipkinOptions): ThriftHapiPlugin {
    return {
        name: 'hapi-zipkin-plugin',
        version: pkg.version,
        async register(server: Hapi.Server, nothing: void): Promise<void> {
            const tracer = getTracerForService(localServiceName, tracerConfig)
            const instrumentation = new Instrumentation.HttpServer({
                tracer,
                port,
            })

            server.ext(
                'onPreHandler',
                (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    const requestMethod: string =
                        isThrift === true
                            ? Core.readThriftMethod(
                                  request.payload as Buffer,
                                  Core.getTransport(transport),
                                  Core.getProtocol(protocol),
                              )
                            : request.method

                    const normalHeaders: Core.IRequestHeaders = normalizeHeaders(
                        request.headers,
                    )

                    return tracer.scoped(() => {
                        const traceId: TraceId = instrumentation.recordRequest(
                            requestMethod,
                            Core.formatUrl(url.format(request.url)),
                            (header: string): option.IOption<any> => {
                                const val = normalHeaders[header.toLowerCase()]
                                if (val !== null && val !== undefined) {
                                    return new option.Some(val)
                                } else {
                                    return option.None
                                }
                            },
                        )

                        const traceHeaders: Core.IRequestHeaders = headersForTraceId(
                            traceId,
                        )

                        // Update headers on request object
                        for (const key in traceHeaders) {
                            if (traceHeaders.hasOwnProperty(key)) {
                                request.headers[key] = traceHeaders[key]
                            }
                        }

                        request.plugins.zipkin = { traceId }

                        return reply.continue
                    })
                },
            )

            server.ext(
                'onPreResponse',
                (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    const statusCode = readStatusCode(request)
                    const traceId: any = (request.plugins as any).zipkin.traceId

                    tracer.scoped(() => {
                        instrumentation.recordResponse(traceId, `${statusCode}`)
                    })

                    return reply.continue
                },
            )
        },
    }
}
