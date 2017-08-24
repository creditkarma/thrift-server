import * as Hapi from 'hapi'
import * as Thrift from 'thrift'
import * as InputBufferUnderrunError from 'thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error'

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

const transports = {
  buffered: Thrift.TBufferedTransport,
  framed: Thrift.TFramedTransport,
}
const supportedTransports = Object.keys(transports)

const protocols = {
  binary: Thrift.TBinaryProtocol,
  compact: Thrift.TCompactProtocol,
  json: Thrift.TJSONProtocol,
}
const supportedProtocols = Object.keys(protocols)

function supportsTransport(transport: string): boolean {
  return supportedTransports.indexOf(transport) !== -1
}

function supportsProtocol(protocol: string): boolean {
  return supportedProtocols.indexOf(protocol) !== -1
}

function handleBody(processor, buffer, Transport, Protocol, context) {
  const transportWithData = new Transport()
  transportWithData.inBuf = buffer
  transportWithData.writeCursor = buffer.length
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

function readThriftMethod(buffer, Transport, Protocol) {
    const transportWithData = new Transport()
    transportWithData.inBuf = buffer
    transportWithData.writeCursor = buffer.length
    const input: Thrift.TProtocol = new Protocol(transportWithData)

    const begin = input.readMessageBegin()

    return begin.fname
}

export const ThriftPlugin: Hapi.PluginRegistrationObject<IPluginOptions> = {

    register(server, pluginOptions, next) {

        const transport = pluginOptions.transport
        if (transport && !supportsTransport(transport)) {
            throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
        }

        const protocol = pluginOptions.protocol
        if (protocol && !supportsProtocol(protocol)) {
            throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
        }

        let Transport
        if (transport) {
            Transport = transports[transport]
        } else {
            Transport = transports.buffered
        }

        let Protocol
        if (protocol) {
            Protocol = protocols[protocol]
        } else {
            Protocol = protocols.binary
        }

        server.ext('onPreHandler', function(request, reply) {
            try {
                const method = readThriftMethod(request.payload, Transport, Protocol)
                request.plugins.thrift = Object.assign({}, request.plugins.thrift, { method })
                return reply.continue()
            } catch (err) {
                return reply(err)
            }
        })

        server.handler('thrift', function(route, options: IHandlerOptions) {
            const service = options.service
            if (!service) {
                throw new Error('No service implementation specified.')
            }

            return async function(request, reply) {
                try {
                    const result = await handleBody(service, request.payload, Transport, Protocol, request)
                    return reply(result)
                } catch (err) {
                    return reply(err)
                }
            }
        })

        next()
    },
}

ThriftPlugin.register.attributes = {
    name: 'thriftPlugin',
    version: '1.0.0',
}
