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
// TODO: Is there a better way to make nice error messages in plugins without exporting this?
export const supportedTransports = Object.keys(transports)

const protocols = {
  binary: TBinaryProtocol,
  compact: TCompactProtocol,
  json: TJSONProtocol,
}
// TODO: Is there a better way to make nice error messages in plugins without exporting this?
export const supportedProtocols = Object.keys(protocols)

// TODO: Can we infer the transport?
export function getTransport(transport: string = 'buffered') {
  return transports[transport]
}

// TODO: Is this the correct default? - npm thrift uses Binary here
// TODO: Can we infer the protocol?
export function getProtocol(protocol: string = 'binary') {
  return protocols[protocol]
}

// TODO: How should Services/handlers be typed?
export function getService(Service, handlers) {
  if (Service.Processor) {
    return new Service.Processor(handlers)
  } else {
    // TODO: This assumes that the Processor was passed
    return new Service(handlers)
  }
}

export function isTransportSupported(transport: string): boolean {
  // TODO: TypeScript still doesn't support .contains method
  return supportedTransports.indexOf(transport) !== -1
}

export function isProtocolSupported(protocol: string): boolean {
  // TODO: TypeScript still doesn't support .contains method
  return supportedProtocols.indexOf(protocol) !== -1
}

// TODO: What should this Promise be typed as?
export function handleBody(processor, buffer, Transport, Protocol): Promise<any> {
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
