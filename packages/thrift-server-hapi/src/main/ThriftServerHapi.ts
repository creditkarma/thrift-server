import * as Hapi from 'hapi'

import * as Core from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    IHapiServerOptions,
    ThriftHapiPlugin,
} from './types'

import { defaultLogger } from './logger'

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
    const thriftOptions: IHapiServerOptions<TProcessor> =
        pluginOptions.thriftOptions
    const logger: Core.LogFunction = thriftOptions.logger || defaultLogger
    const thriftPath: string = Core.normalizePath(
        pluginOptions.path || '/thrift',
    )
    const serviceName: string = pluginOptions.thriftOptions.serviceName

    const Transport: Core.ITransportConstructor = Core.getTransport(
        thriftOptions.transport,
    )
    const Protocol: Core.IProtocolConstructor = Core.getProtocol(
        thriftOptions.protocol,
    )
    const processor: Core.IThriftProcessor<Hapi.Request> = thriftOptions.handler
    const rawServicename: string = processor._serviceName || '<none>'

    return {
        name: require('../../package.json').name,
        version: require('../../package.json').version,
        multiple: true,
        async register(server: Hapi.Server, nothing: void): Promise<void> {
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
             * Save information about how we are handling thrift on this server
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
             * This is a compatibility filter with Finagle that creates an endpoint for each Thrift method.
             * We do one endpoint per service at this point. It probably makes sense to move to an endpoint
             * per method in a later release.
             */
            server.ext(
                'onRequest',
                (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    const path: string = request.url.path || ''
                    if (
                        path
                            .toLowerCase()
                            .indexOf(rawServicename.toLowerCase()) > -1
                    ) {
                        logger(
                            ['info', 'ThriftServerHapi'],
                            `Request path rewritten: '${path}' to '${thriftPath}'`,
                        )
                        request.setUrl(thriftPath)
                    }
                    return reply.continue
                },
            )

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

                                return reply.response(output.flush()).code(200)
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

            const handler: Hapi.Lifecycle.Method = (
                request: Hapi.Request,
                reply: Hapi.ResponseToolkit,
            ) => {
                const buffer: Buffer = request.payload as Buffer
                const method: string = Core.readThriftMethod(
                    buffer,
                    Transport,
                    Protocol,
                )

                request.plugins.thrift = {
                    requestMethod: method,
                }

                return Core.process<Hapi.Request>({
                    processor,
                    buffer,
                    Transport,
                    Protocol,
                    context: request,
                })
            }

            thriftOptions.handler._methodNames.forEach((methodName: string) => {
                const methodPerEndpointPath: string = `${thriftPath}/${rawServicename}/${methodName}`
                server.route({
                    method: 'POST',
                    path: methodPerEndpointPath,
                    handler,
                    options: {
                        payload: {
                            parse: false,
                        },
                        auth: pluginOptions.auth,
                    },
                })
            })

            server.route({
                method: 'POST',
                path: `${thriftPath}/{p*}`,
                handler,
                options: {
                    payload: {
                        parse: false,
                    },
                    auth: pluginOptions.auth,
                },
            })
        },
    }
}
