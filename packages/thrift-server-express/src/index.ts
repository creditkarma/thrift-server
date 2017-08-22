import TBufferedTransport = require('thrift/lib/nodejs/lib/thrift/buffered_transport')
import TFramedTransport = require('thrift/lib/nodejs/lib/thrift/framed_transport')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

import TBinaryProtocol = require('thrift/lib/nodejs/lib/thrift/binary_protocol')
import TCompactProtocol = require('thrift/lib/nodejs/lib/thrift/compact_protocol')
import TJSONProtocol = require('thrift/lib/nodejs/lib/thrift/json_protocol')

const transports = {
  buffered: TBufferedTransport,
  framed: TFramedTransport,
}
const supportedTransports = Object.keys(transports)

const protocols = {
  binary: TBinaryProtocol,
  compact: TCompactProtocol,
  json: TJSONProtocol,
}
const supportedProtocols = Object.keys(protocols)

function handleBody(processor, buffer, Transport, Protocol) {
  const transportWithData = new Transport()
  transportWithData.inBuf = buffer
  transportWithData.writeCursor = buffer.length
  const input = new Protocol(transportWithData)

  return new Promise((resolve, reject) => {
    const output = new Protocol(new Transport(undefined, resolve))

    try {
      processor.process(input, output)
      transportWithData.commitPosition()
    } catch (err) {
      if (err instanceof InputBufferUnderrunError) {
        transportWithData.rollbackPosition()
      }
      reject(err)
    }
  })
}

export interface IOptions {
  transport?: string
  protocol?: string
}

function supportsTransport(transport: string): boolean {
  // TODO: TypeScript still doesn't support .contains method
  return supportedTransports.indexOf(transport) !== -1
}

function supportsProtocol(protocol: string): boolean {
  // TODO: TypeScript still doesn't support .contains method
  return supportedProtocols.indexOf(protocol) !== -1
}

// TODO: Is there a cleaner way to type + default options?
export function thriftExpress(Service, handlers, options: IOptions = {} as any) {

  const transport = options.transport
  if (transport && !supportsTransport(transport)) {
    throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
  }

  const protocol = options.protocol
  if (protocol && !supportsProtocol(protocol)) {
    throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
  }

  let service
  if (Service.Processor) {
    service = new Service.Processor(handlers)
  } else {
    // TODO: This assumes that the Processor was passed
    service = new Service(handlers)
  }

  async function handler(req, res, next) {
    if (req.method !== 'POST') {
      return res.status(403).send('Method must be POST')
    }

    let Transport
    if (transport) {
      Transport = transports[transport]
    } else {
      // TODO: Can we infer this?
      // TODO: If not, this can just be defaulted in options
      Transport = transports.buffered
    }

    let Protocol
    if (protocol) {
      Protocol = protocols[protocol]
    } else {
      // TODO: Is this the correct default? - npm thrift uses Binary here
      // TODO: Can we infer this?
      // TODO: If not, this can just be defaulted in options
      Protocol = protocols.binary
    }

    try {
      const result = await handleBody(service, req.body, Transport, Protocol)
      res.status(200).end(result)
    } catch (err) {
      next(err)
    }
  }

  return handler
}
