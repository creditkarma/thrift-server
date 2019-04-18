import * as Hapi from 'hapi'

import * as Core from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    ThriftHapiPlugin,
    HapiThriftOptions,
} from './types'

import { defaultLogger } from './logger'

export const DEFAULT_PATH: string = '/thrift'

// Extend Hapi types with our plugin
declare module 'hapi' {
    // tslint:disable-next-line:interface-name
    export interface PluginProperties {
        thrift?: {
            transport: Core.TransportType
            protocol: Core.ProtocolType
            services: {
                [name: string]: {
                    processor: Core.IThriftProcessor<Hapi.Request>
                }
            }
        }
    }

    // tslint:disable-next-line:interface-name
    export interface PluginsStates {
        thrift?: {
            requestMethod: string
            payload: Buffer
        }
    }
}

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<
    TProcessor extends Core.IThriftProcessor<Hapi.Request>
>(pluginOptions: IHapiPluginOptions<TProcessor>): ThriftHapiPlugin {
    const thriftOptions: HapiThriftOptions<TProcessor> = pluginOptions.thriftOptions

    const logger: Core.LogFunction = thriftOptions.logger || defaultLogger

    const thriftPath: string = Core.normalizePath(
        pluginOptions.path || DEFAULT_PATH,
    )

    const serviceName: string = pluginOptions.thriftOptions.serviceName

    const Transport: Core.ITransportConstructor = Core.getTransport(
        thriftOptions.transport,
    )

    const Protocol: Core.IProtocolConstructor = Core.getProtocol(
        thriftOptions.protocol,
    )
    const processor: Core.IThriftProcessor<Hapi.Request> = thriftOptions.handler
    const rawServiceName: string = processor.__metadata.name
    const methodNames: Array<string> = Object.keys(processor.__metadata.methods)

    return {
        name: 'ThriftServerHapi',
        version: require('../../package.json').version,
        multiple: true,
        async register(server: Hapi.Server): Promise<void> {

            if (
                server.plugins.thrift !== undefined &&
                (server.plugins.thrift.transport !==
                    (thriftOptions.transport || 'buffered') ||
                    server.plugins.thrift.protocol !==
                        (thriftOptions.protocol || 'binary'))
            ) {
                logger(
                    ['error', 'ThriftServerHapi'],
                    `You are registering services with different transport/protocol combinations on the same Hapi.Server instance. You may experience unexpected behavior.`,
                )
            }

            /**
             * Save information about how we are handling thrift on this server.
             */
            server.plugins.thrift = {
                transport: thriftOptions.transport || 'buffered',
                protocol: thriftOptions.protocol || 'binary',
                services: {
                    [serviceName]: {
                        processor,
                    },
                },
            }

            /**
             * If an error occurred within the process of handling this request and it was not otherwise
             * handled we take the error here and wrap it in a TApplicationException so that it can be
             * properly read by consuming Thrift clients.
             */
            server.ext(
                'onPreResponse',
                (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    const response = request.response
                    if (response !== null) {
                        // We only need to change things if we have an error on a thrift request.
                        if (
                            (response as any).isBoom &&
                            request.plugins.thrift !== undefined
                        ) {
                            try {
                                const transportWithData: Core.TTransport = Transport.receiver(
                                    request.payload as Buffer,
                                )
                                const input: Core.TProtocol = new Protocol(
                                    transportWithData,
                                )
                                const metadata: Core.IThriftMessage = input.readMessageBegin()
                                const fieldName: string = metadata.fieldName
                                const requestId: number = metadata.requestId

                                const output: Core.TProtocol = new Protocol(
                                    new Transport(),
                                )
                                const exception: Core.TApplicationException = new Core.TApplicationException(
                                    Core.TApplicationExceptionType.INTERNAL_ERROR,
                                    response.message as string, // If we're dealing with an error this is an Error not a Response
                                )

                                output.writeMessageBegin(
                                    fieldName,
                                    Core.MessageType.EXCEPTION,
                                    requestId,
                                )
                                Core.TApplicationExceptionCodec.encode(
                                    exception,
                                    output,
                                )
                                output.writeMessageEnd()

                                return reply.response(output.flush()).code(500)
                            } catch (err) {
                                logger(
                                    ['error', 'ThriftServerHapi'],
                                    `Unable to build TApplicationException for response error: ${
                                        err.message
                                    }`,
                                )
                                return reply.continue
                            }
                        } else {
                            return reply.continue
                        }
                    } else {
                        return reply.continue
                    }
                },
            )

            /**
             * Before auth we read the Thrift payload and store the data on the request. This should allow
             * other plugins to easily inspect the Thrift payload before it is processed.
             */
            server.ext(
                'onRequest',
                (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    return new Promise((resolve, reject) => {
                        const payload: Array<Buffer> = []
                        request.raw.req.on('data', (chunk: Buffer) => {
                            payload.push(chunk)
                        })
                        request.raw.req.on('end', () => {
                            const buffer: Buffer = Buffer.concat(payload)
                            const method: string = Core.readThriftMethod(
                                buffer,
                                Transport,
                                Protocol,
                            )

                            request.plugins.thrift = {
                                requestMethod: method,
                                payload: buffer,
                            }

                            resolve(reply.continue)
                        })
                    })
                },
            )

            const handler: Hapi.Lifecycle.Method = (
                request: Hapi.Request,
                reply: Hapi.ResponseToolkit,
            ) => {
                if (request.plugins.thrift) {
                    return Core.process<Hapi.Request>({
                        processor,
                        buffer: request.plugins.thrift.payload,
                        Transport,
                        Protocol,
                        context: request,
                    })
                } else {
                    throw new Error(`No Thrift payload on request`)
                }
            }

            if (thriftOptions.withEndpointPerMethod === true) {
                thriftOptions.handler._methodNames.forEach(
                    (methodName: string) => {
                        const methodPerEndpointPath: string = `${thriftPath}/${rawServiceName}/${methodName}`
                        server.route(routeForPath(methodPerEndpointPath))
                    },
                )

                server.route(routeForPath(`${thriftPath}/{p*}`))
            } else {
                server.route(routeForPath(thriftPath === '' ? '/' : `${thriftPath}`))
            }

            function routeForPath(path: string): Hapi.ServerRoute {
                return {
                    method: 'POST',
                    path,
                    vhost: pluginOptions.vhost || undefined,
                    handler,
                    options: Object.assign({}, (pluginOptions.route || {}), {
                        payload: {
                            parse: false,
                        },
                    }),
                }
            }
        },
    }
}
