import * as Hapi from 'hapi'

import {
  getProtocol,
  getTransport,
  process,
  supportedProtocols,
  supportedTransports,
  supportsProtocol,
  supportsTransport,
} from '@creditkarma/thrift-server-core'

import {
  TProtocol,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

export interface IHandlerOptions {
  service: object
}

export interface IPluginOptions {
    transport?: string
    protocol?: string
}

export interface IThriftContext {
    method: string
}

function readThriftMethod(buffer: Buffer, Transport: TTransportConstructor, Protocol: TProtocolConstructor) {
    const transportWithData = new Transport(undefined, () => null);
    (transportWithData as any).inBuf = buffer;
    (transportWithData as any).writeCursor = buffer.length
    const input: TProtocol = new Protocol(transportWithData)

    const begin = input.readMessageBegin()

    return begin.fname
}

export const ThriftPlugin: Hapi.PluginRegistrationObject<IPluginOptions> = {

    register(server, pluginOptions, next) {

        const transport: string | undefined = pluginOptions.transport
        if (transport && !supportsTransport(transport)) {
            next(new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`))
        }

        const protocol: string | undefined = pluginOptions.protocol
        if (protocol && !supportsProtocol(protocol)) {
            next(new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`))
        }

        const Transport: TTransportConstructor = getTransport(transport)
        const Protocol: TProtocolConstructor = getProtocol(protocol)

        server.handler('thrift', (route, options: IHandlerOptions) => {
            const service = options.service
            if (!service) {
                throw new Error('No service implementation specified.')
            }

            return (request, reply) => {
                try {
                    const method = readThriftMethod(request.payload, Transport, Protocol)
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
}

ThriftPlugin.register.attributes = {
    pkg: require('../../package.json'),
}
