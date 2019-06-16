import * as Hapi from '@hapi/hapi'

import * as Core from '@creditkarma/thrift-server-core'

import { ThriftContext } from '@creditkarma/thrift-server-core'
import {
    HapiThriftOptions,
    IHapiPluginOptions,
    ThriftHapiPlugin,
} from './types'

export const DEFAULT_PATH: string = '/thrift'

// Extend Hapi types with our plugin
declare module '@hapi/hapi' {
    // tslint:disable-next-line:interface-name
    export interface PluginProperties {
        thrift?: {
            // transport: Core.TransportType
            // protocol: Core.ProtocolType
            services: {
                [name: string]: {
                    processor: Core.IThriftProcessor<any>
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
    TProcessor extends Core.IThriftProcessor<Context>,
    Context extends object = {}
>(pluginOptions: IHapiPluginOptions<TProcessor, Context>): ThriftHapiPlugin {
    const thriftOptions: HapiThriftOptions<TProcessor, Context> =
        pluginOptions.thriftOptions

    const thriftPath: string = Core.normalizePath(
        pluginOptions.path || DEFAULT_PATH,
    )

    const serviceName: string = pluginOptions.thriftOptions.serviceName

    const processor: Core.IThriftProcessor<Context> = thriftOptions.handler

    const Transport: Core.ITransportConstructor = processor.Transport

    const Protocol: Core.IProtocolConstructor = processor.Protocol

    const rawServiceName: string = processor.__metadata.name
    const methodNames: Array<string> = Object.keys(processor.__metadata.methods)

    return {
        name: 'ThriftServerHapi',
        version: require('../../package.json').version,
        multiple: true,
        async register(server: Hapi.Server): Promise<void> {
            /**
             * Save information about how we are handling thrift on this server.
             */
            server.plugins.thrift = {
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
                                server.log(
                                    ['error', 'ThriftServerHapi'],
                                    `Unable to build TApplicationException for response error: ${err.message}`,
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

            const logFactory: Core.LogFactory<Hapi.Request> =
                thriftOptions.logFactory ||
                ((_: any) => {
                    return (tags: Array<string>, data?: any) => {
                        console.log(`[${tags.join(',')}]: `, data)
                    }
                })

            const clientFactory: Core.ClientFactory =
                thriftOptions.clientFactory ||
                ((name: string, args?: any) => {
                    throw new Error('Not implemented')
                })

            const contextFacotry =
                thriftOptions.contextFactory || ((_: Hapi.Request) => ({}))

            const handler: Hapi.Lifecycle.Method = (
                request: Hapi.Request,
                reply: Hapi.ResponseToolkit,
            ) => {
                const buffer: Buffer = request.payload as Buffer
                const context: any = contextFacotry(request)
                const mergedContext: ThriftContext<Context> = Core.deepMerge(
                    context,
                    {
                        headers: request.headers,
                        log: logFactory(request),
                        getClient: clientFactory,
                    },
                )

                return processor.process(buffer, mergedContext)
            }

            if (thriftOptions.withEndpointPerMethod === true) {
                methodNames.forEach((methodName: string) => {
                    const methodPerEndpointPath: string = `${thriftPath}/${rawServiceName}/${methodName}`
                    server.route(routeForPath(methodPerEndpointPath))
                })

                server.route(routeForPath(`${thriftPath}/{p*}`))
            } else {
                server.route(
                    routeForPath(thriftPath === '' ? '/' : `${thriftPath}`),
                )
            }

            function routeForPath(path: string): Hapi.ServerRoute {
                return {
                    method: 'POST',
                    path,
                    vhost: pluginOptions.vhost || undefined,
                    handler,
                    options: Object.assign({}, pluginOptions.route || {}, {
                        payload: {
                            parse: false,
                        },
                    }),
                }
            }
        },
    }
}
