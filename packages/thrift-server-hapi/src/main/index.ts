import * as Hapi from 'hapi'

import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
    process,
    ProtocolType,
    TProtocol,
    TransportType,
} from '@creditkarma/thrift-server-core'

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export interface IPluginOptions<TProcessor> {
    handler: TProcessor
    path?: string
    transport?: TransportType
    protocol?: ProtocolType
}

export interface IThriftServerOptions<TProcessor> extends IPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin =
    Hapi.PluginRegistrationObject<never>

function readThriftMethod(buffer: Buffer, Transport: ITransportConstructor, Protocol: IProtocolConstructor): string {
    const transportWithData = new Transport(buffer)
    const input: TProtocol = new Protocol(transportWithData)
    const { fieldName } = input.readMessageBegin()

    return fieldName
}

export function createThriftServer<TProcessor extends IThriftProcessor<Hapi.Request>>(
    options: IThriftServerOptions<TProcessor>,
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
    server.register(ThriftPlugin<TProcessor>({
        handler: options.handler,
        path: options.path,
        transport: options.transport,
        protocol: options.protocol,
    }), (err: any) => {
        if (err) {
            throw err
        }
    })

    return server
}

export function ThriftPlugin<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const plugin: ThriftHapiPlugin = {
        register(server: Hapi.Server, nothing: never, next) {
            const Transport: ITransportConstructor = getTransport(pluginOptions.transport)
            const Protocol: IProtocolConstructor = getProtocol(pluginOptions.protocol)
            const pluginPath: string = pluginOptions.path || '/'

            server.route({
                method: 'POST',
                path: pluginPath,
                handler: (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
                    try {
                        const method: string = readThriftMethod(request.payload, Transport, Protocol)
                        request.plugins.thrift = Object.assign({}, request.plugins.thrift, { method })
                        reply(process(pluginOptions.handler, request.payload, Transport, Protocol, request))
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
    };

    (plugin.register as any).attributes = {
        pkg: require('../../package.json'),
    }

    return plugin
}
