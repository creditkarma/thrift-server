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

export * from './observability'

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export interface IHapiPluginOptions<TProcessor> {
    path?: string
    auth?: false | string | Hapi.AuthOptions
    thriftOptions: IThriftServerOptions<TProcessor>
}

export interface ICreateHapiServerOptions<TProcessor>
    extends IHapiPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin = Hapi.PluginRegistrationObject<undefined>

/**
 * Creates and returns a Hapi server with the thrift plugin registered.
 *
 * @param options
 */
export function createThriftServer<TProcessor extends IThriftProcessor<Hapi.Request>>(
    options: ICreateHapiServerOptions<TProcessor>,
): Hapi.Server {
    const server = new Hapi.Server({ debug: { request: ['error'] } })

    server.connection({ port: options.port })

    /**
     * Register the thrift plugin.
     *
     * This will allow us to define Hapi routes for our thrift service(s).
     * They behave like any other HTTP route handler, so you can mix and match
     * thrift / REST endpoints on the same server instance.
     */
    server.register(
        ThriftServerHapi<TProcessor>({
            path: options.path,
            thriftOptions: options.thriftOptions,
        }),
        (err: any) => {
            if (err) {
                console.log('error: ', err)
                throw err
            }
        },
    )

    return server
}

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const hapiThriftPlugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: undefined, next) {
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
    }

    return hapiThriftPlugin
}
