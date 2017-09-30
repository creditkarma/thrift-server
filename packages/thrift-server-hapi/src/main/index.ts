import * as Hapi from 'hapi'
import {
  TBinaryProtocol,
  TBufferedTransport,
  TCompactProtocol,
  TFramedTransport,
  TJSONProtocol,
  TProtocol,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'
const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

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

interface ITransportMap {
  [name: string]: TTransportConstructor
}

const transports: ITransportMap = {
  buffered: TBufferedTransport,
  framed: TFramedTransport,
}
const supportedTransports = Object.keys(transports)

interface IProtocolMap {
  [name: string]: TProtocolConstructor
}

const protocols: IProtocolMap = {
  binary: TBinaryProtocol,
  compact: TCompactProtocol,
  json: TJSONProtocol,
}
const supportedProtocols = Object.keys(protocols)

function supportsTransport(transport: string): boolean {
  return supportedTransports.indexOf(transport) !== -1
}

function supportsProtocol(protocol: string): boolean {
  return supportedProtocols.indexOf(protocol) !== -1
}

function handleBody(
  processor: any,
  buffer: Buffer,
  Transport: TTransportConstructor,
  Protocol: TProtocolConstructor,
  context: any): Promise<any> {
  const transportWithData = new Transport(undefined, () => null);
  (transportWithData as any).inBuf = buffer;
  (transportWithData as any).writeCursor = buffer.length
  const input = new Protocol(transportWithData)

  return new Promise((resolve, reject) => {
    const output = new Protocol(new Transport(undefined, resolve))

    try {
      processor.process(input, output, context)
      transportWithData.commitPosition()
    } catch (err) {
      if (err instanceof InputBufferUnderrunError) {
        transportWithData.rollbackPosition()
      }
      reject(err)
    }
  })
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

        const transport = pluginOptions.transport
        if (transport && !supportsTransport(transport)) {
            next(new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`))
        }

        const protocol = pluginOptions.protocol
        if (protocol && !supportsProtocol(protocol)) {
            next(new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`))
        }

        let Transport: TTransportConstructor
        if (transport) {
            Transport = transports[transport]
        } else {
            Transport = transports.buffered
        }

        let Protocol: TProtocolConstructor
        if (protocol) {
            Protocol = protocols[protocol]
        } else {
            Protocol = protocols.binary
        }

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

                const result = handleBody(service, request.payload, Transport, Protocol, request)
                return reply(result)
            }
        })

        next()
    },
}

ThriftPlugin.register.attributes = {
    pkg: require('../../package.json'),
}
