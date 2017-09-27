import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

// New implementation
import BufferedTransport from './transports/BufferedTransport'
import FramedTransport from './transports/FramedTransport'

import TCompactProtocol = require('thrift/lib/nodejs/lib/thrift/compact_protocol')
import TJSONProtocol = require('thrift/lib/nodejs/lib/thrift/json_protocol')
// New implementation
import BinaryProtocol from './protocols/BinaryProtocol'

const transports = {
  buffered: BufferedTransport,
  framed: FramedTransport,
}
// TODO: Is there a better way to make nice error messages in plugins without exporting this?
export const supportedTransports = Object.keys(transports)

const protocols = {
  binary: BinaryProtocol,
  // Still old impl
  compact: TCompactProtocol,
  json: TJSONProtocol,
}
// TODO: Is there a better way to make nice error messages in plugins without exporting this?
export const supportedProtocols = Object.keys(protocols)

// TODO: Can we infer the transport?
export function getTransport(transport: string = 'buffered') {
  return transports[transport]
}

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
// TODO: More importantly, what should be returned? status code or something?
export async function process(processor, stream, Transport, Protocol): Promise<void> {
  const transport = new Transport(stream)
  const protocol = new Protocol(transport)

  try {
    await processor.process(protocol)
  } catch (err) {
    if (err instanceof InputBufferUnderrunError) {
      // TODO: How does this differ?
    }
    throw err
  }
}
