import * as Hapi from 'hapi'

import {
    getProtocol,
    getTransport,
    IPluginOptions,
    IThriftProcessor,
    process,
} from '@creditkarma/thrift-server-core'

import {
    TProtocol,
    TProtocolConstructor,
    TTransportConstructor,
} from 'thrift'

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export interface IThriftContext {
    method: string
}

export type ThriftHapiPlugin =
    Hapi.PluginRegistrationObject<IPluginOptions>

function readThriftMethod(buffer: Buffer, Transport: TTransportConstructor, Protocol: TProtocolConstructor): string {
    const transportWithData = new Transport(undefined, () => null);
    (transportWithData as any).inBuf = buffer;
    (transportWithData as any).writeCursor = buffer.length
    const input: TProtocol = new Protocol(transportWithData)

    const begin = input.readMessageBegin()

    return begin.fname
}

export function createPlugin<TProcessor extends IThriftProcessor<Hapi.Request>>(): ThriftHapiPlugin {
    const plugin: Hapi.PluginRegistrationObject<IPluginOptions> = {
        register(server: Hapi.Server, pluginOptions: IPluginOptions, next) {
            const Transport: TTransportConstructor = getTransport(pluginOptions.transport)
            const Protocol: TProtocolConstructor = getProtocol(pluginOptions.protocol)

            server.handler('thrift', (route: Hapi.RoutePublicInterface, options: IHandlerOptions<TProcessor>) => {
                const service = options.service
                if (!service) {
                    throw new Error('No service implementation specified.')
                }

                return (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
                    try {
                        const method: string = readThriftMethod(request.payload, Transport, Protocol)
                        request.plugins.thrift = Object.assign({}, request.plugins.thrift, { method })
                    } catch (err) {
                        return reply(err)
                    }

                    const result = process(service, request.payload, Transport, Protocol, request)
                    return reply(result)
                }
            })

            next()
        },
    };

    (plugin.register as any).attributes = {
        pkg: require('../../package.json'),
    }

    return plugin
}

export const ThriftPlugin: ThriftHapiPlugin = createPlugin<any>()
