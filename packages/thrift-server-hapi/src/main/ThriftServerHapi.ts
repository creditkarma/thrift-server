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
    const hapiThriftPlugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: never, next) {
            server.route({
                method: 'POST',
                path: pluginOptions.path || '/thrift',
                handler: (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
                    const options: IThriftServerOptions<TProcessor> = pluginOptions.thriftOptions

                    const Transport: ITransportConstructor = getTransport(
                        options.transport,
                    )

                    const Protocol: IProtocolConstructor = getProtocol(
                        options.protocol,
                    )

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
