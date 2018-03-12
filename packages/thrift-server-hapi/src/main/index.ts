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

export type HapiOptionsFunction<TProcessor> = (
    req?: Hapi.Request,
) => IThriftServerOptions<TProcessor>

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export type HapiThriftOptionsFunction<TProcessor> = (
    request: Hapi.Request,
    reply: Hapi.ReplyNoContinue,
) => IThriftServerOptions<TProcessor>

export interface IHapiPluginOptions<TProcessor> {
    path?: string
    thriftOptions:
        | IThriftServerOptions<TProcessor>
        | HapiOptionsFunction<TProcessor>
}

export interface ICreateHapiServerOptions<TProcessor>
    extends IHapiPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin = Hapi.PluginRegistrationObject<never>

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
        thirftServerHapi<TProcessor>({
            path: options.path,
            thriftOptions: options.thriftOptions,
        }),
        (err: any) => {
            if (err) {
                console.log('error 2: ', err)
                throw err
            }
        },
    )

    return server
}

function getPluginOptions<TProcessor>(
    request: Hapi.Request,
    options: IHapiPluginOptions<TProcessor>,
): IThriftServerOptions<TProcessor> {
    if (typeof options.thriftOptions === 'function') {
        return options.thriftOptions(request)
    } else {
        return options.thriftOptions
    }
}

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function thirftServerHapi<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const hapiThriftPlugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: never, next) {
            server.route({
                method: 'POST',
                path: pluginOptions.path || '/thrift',
                handler: (
                    request: Hapi.Request,
                    reply: Hapi.ReplyNoContinue,
                ) => {
                    const options: IThriftServerOptions<TProcessor> =
                        getPluginOptions(request, pluginOptions)

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
                },
            })

            next()
        },
    }

    hapiThriftPlugin.register.attributes = {
        pkg: {
            name: 'thrift-server-hapi',
            version: require('../../package.json').version,
        },
    }

    return hapiThriftPlugin
}
