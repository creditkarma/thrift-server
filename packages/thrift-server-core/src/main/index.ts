import {
  TBinaryProtocol,
  TBufferedTransport,
  TCompactProtocol,
  TFramedTransport,
  TJSONProtocol,
  TProcessorConstructor,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

interface ITransportMap {
  [name: string]: TTransportConstructor
}

const transports: ITransportMap = {
  buffered: TBufferedTransport,
  framed: TFramedTransport,
}

export const supportedTransports = Object.keys(transports)

interface IProtocolMap {
  [name: string]: TProtocolConstructor
}

const protocols: IProtocolMap = {
  binary: TBinaryProtocol,
  compact: TCompactProtocol,
  json: TJSONProtocol,
}

export const supportedProtocols = Object.keys(protocols)

// TODO: Can we infer the transport?
export function getTransport(transport: string = 'buffered'): TTransportConstructor {
  return transports[transport]
}

export function getProtocol(protocol: string = 'binary'): TProtocolConstructor {
  return protocols[protocol]
}

export function supportsTransport(transport: string): boolean {
  return supportedTransports.indexOf(transport) !== -1
}

export function supportsProtocol(protocol: string): boolean {
  return supportedProtocols.indexOf(protocol) !== -1
}

// TODO: How should Services/handlers be typed?
export function getService<TProcessor, THandler>(
  Service: TProcessorConstructor<TProcessor, THandler>,
  handlers: THandler) {
  if ((Service as any).Processor) {
    return new (Service as any).Processor(handlers)
  } else {
    // TODO: This assumes that the Processor was passed
    return new (Service as any)(handlers)
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

export function process<Context>(
  processor: any,
  buffer: Buffer,
  Transport: TTransportConstructor,
  Protocol: TProtocolConstructor,
  context?: Context): Promise<any> {
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
