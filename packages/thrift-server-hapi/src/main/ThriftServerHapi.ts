import * as Hapi from 'hapi'

import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    IThriftServerOptions,
    ITransportConstructor,
    process,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    ThriftHapiPlugin,
} from './types'

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const options: IThriftServerOptions<TProcessor> = pluginOptions.thriftOptions
    const Transport: ITransportConstructor = getTransport(options.transport)
    const Protocol: IProtocolConstructor = getProtocol(options.protocol)
    const thriftPath: string = pluginOptions.path || '/thrift'
    const handler: any = options.handler
    const serviceName: string = handler._serviceName || '<nope>'

    const hapiThriftPlugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: never, next) {
            // This is a compatibility filter with Finagle that creates an endpoint for each Thrift method.
            // We do one endpoint per service at this point. It probably makes sense to move to an endpoint
            // per method in a later release.
            server.ext('onRequest', (request, reply) => {
                const path: string = request.url.path || ''
                if (path.toLocaleLowerCase().indexOf(serviceName.toLocaleLowerCase()) > -1) {
                    request.setUrl(thriftPath)
                }
                return reply.continue()
            })

            server.route({
                method: 'POST',
                path: thriftPath,
                handler: (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
                    try {
                        const method: string = readThriftMethod(
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
                            process<Hapi.Request>({
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
