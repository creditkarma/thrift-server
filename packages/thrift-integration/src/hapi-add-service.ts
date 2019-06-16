import { IThriftContext } from '@creditkarma/thrift-server-core'

import { createThriftServer } from '@creditkarma/thrift-server-hapi'

import { ZipkinTracingHapi } from '@creditkarma/zipkin-tracing-hapi'

import * as Hapi from '@hapi/hapi'

import { ADD_SERVER_CONFIG } from './config'

import { AddService } from './generated/add-service'

export async function createServer(
    sampleRate: number = 0,
): Promise<Hapi.Server> {
    /**
     * Implementation of our thrift service.
     *
     * Notice the second parameter, "context" - this is the Hapi request object,
     * passed along to our service by the Hapi thrift plugin. Thus, you have access to
     * all HTTP request data from within your service implementation.
     */
    const impl = new AddService.Processor({
        ping(): void {
            return
        },
        add(a: number, b: number, context?: IThriftContext): number {
            return a + b
        },
        addInt64(a: bigint, b: bigint, context?: IThriftContext): bigint {
            return a + b
        },
    })

    /**
     * Creates Hapi server with thrift endpoint.
     */
    const server: Hapi.Server = await createThriftServer({
        port: ADD_SERVER_CONFIG.port,
        path: ADD_SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'add-service',
            handler: impl,
        },
    })

    if (sampleRate > 0) {
        await server.register({
            plugin: ZipkinTracingHapi({
                localServiceName: 'add-service',
                tracerConfig: {
                    endpoint: process.env.ZIPKIN_ENDPOINT,
                    zipkinVersion:
                        process.env.ZIPKIN_VERSION === 'v2' ? 'v2' : 'v1',
                    sampleRate,
                    httpInterval: 0,
                },
            }),
        })
    }

    /**
     * The Hapi server can process requests that are not targeted to the thrift
     * service
     */
    server.route({
        method: 'GET',
        path: '/control',
        handler(
            request: Hapi.Request,
            reply: Hapi.ResponseToolkit,
        ): Hapi.ResponseObject {
            return reply.response('PASS')
        },
    })

    return server
}
