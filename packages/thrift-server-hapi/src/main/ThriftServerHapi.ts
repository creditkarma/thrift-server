import * as Hapi from 'hapi'

import * as Core from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    ThriftHapiPlugin,
} from './types'

import {
    TProtocol,
    TTransport,
} from '@creditkarma/thrift-server-core'
import { defaultLogger as logger } from './logger'

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<TProcessor extends Core.IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const options: Core.IThriftServerOptions<TProcessor> = pluginOptions.thriftOptions
    const Transport: Core.ITransportConstructor = Core.getTransport(options.transport)
    const Protocol: Core.IProtocolConstructor = Core.getProtocol(options.protocol)
    const thriftPath: string = pluginOptions.path || '/thrift'
    const handler: any = options.handler
    const serviceName: string = handler._serviceName || '<nope>'

    const hapiThriftPlugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: never, next) {
            /**
             * This is a compatibility filter with Finagle that creates an endpoint for each Thrift method.
             * We do one endpoint per service at this point. It probably makes sense to move to an endpoint
             * per method in a later release.
             */
            server.ext('onRequest', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const path: string = request.url.path || ''
                if (path.toLocaleLowerCase().indexOf(serviceName.toLocaleLowerCase()) > -1) {
                    logger(['info', 'ThriftServerHapi'], `Request path rewritten: '${path}' to '${thriftPath}'`)
                    request.setUrl(thriftPath)
                }
                return reply.continue()
            })

            /**
             * If an error occurred within the process of handling this request and it was not otherwise
             * handled we take the error here and wrap it in a TApplicationException so that it can be
             * properly read by consuming Thrift clients.
             */
            server.ext('onPreResponse', (request: Hapi.Request, reply: Hapi.ReplyWithContinue) => {
                const response = request.response
                if (response !== null) {
                    // We only need to change things if we have an error on a thrift request.
                    if (response.isBoom && request.plugins.thrift !== undefined) {
                        try {
                            const transportWithData: TTransport = Transport.receiver(request.payload)
                            const input: TProtocol = new Protocol(transportWithData)
                            const metadata: Core.IThriftMessage = input.readMessageBegin()
                            const fieldName: string = metadata.fieldName
                            const requestId: number = metadata.requestId

                            const output: TProtocol = new Protocol(new Transport())
                            const exception: Core.TApplicationException = new Core.TApplicationException(
                                Core.TApplicationExceptionType.INTERNAL_ERROR,
                                (response as any).message, // If we're dealing with an error this is an Error not a Response
                            )

                            output.writeMessageBegin(fieldName, Core.MessageType.EXCEPTION, requestId)
                            exception.write(output)
                            output.writeMessageEnd()

                            return reply(output.flush()).code(200)
                        } catch (err) {
                            logger(['error', 'ThriftServerHapi'], `Unable to build TApplicationException for response error: ${err.message}`)
                            return reply.continue()
                        }

                    } else {
                        return reply.continue()
                    }
                } else {
                    return reply.continue()
                }
            })

            server.route({
                method: 'POST',
                path: thriftPath,
                handler: (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
                    try {
                        const method: string = Core.readThriftMethod(
                            request.payload,
                            Transport,
                            Protocol,
                        )
                        request.plugins.thrift = Object.assign(
                            {},
                            request.plugins.thrift,
                            { method },
                        )
                        reply(
                            Core.process<Hapi.Request>({
                                processor: options.handler,
                                buffer: request.payload,
                                Transport,
                                Protocol,
                                context: request,
                            }),
                        )
                    } catch (err) {
                        reply(err)
                    }
                },
                config: {
                    payload: {
                        parse: false,
                    },
                    auth: pluginOptions.auth,
                },
            })

            next()
        },
    }

    hapiThriftPlugin.register.attributes = {
        name: require('../../package.json').name,
        version: require('../../package.json').version,
        multiple: true,
    }

    return hapiThriftPlugin
}
