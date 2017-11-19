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

import {
  IProtocolMap,
  IThriftProcessor,
  ITransportMap,
  ProtocolType,
  TransportType,
} from './types'

export * from './types'

const transports: ITransportMap = {
  buffered: TBufferedTransport,
  framed: TFramedTransport,
}

export const supportedTransports: string[] = Object.keys(transports)

const protocols: IProtocolMap = {
  binary: TBinaryProtocol,
  compact: TCompactProtocol,
  json: TJSONProtocol,
}

export const supportedProtocols: string[] = Object.keys(protocols)

export function getTransport(transport: TransportType = 'buffered'): TTransportConstructor {
  if (!isTransportSupported(transport)) {
    throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
  }

  return transports[transport]
}

export function getProtocol(protocol: ProtocolType = 'binary'): TProtocolConstructor {
  if (protocol && !isProtocolSupported(protocol)) {
    throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
  }

  return protocols[protocol]
}

export function getService<TProcessor, THandler>(
  Service: TProcessorConstructor<TProcessor, THandler>,
  handlers: THandler): TProcessor {
  if ((Service as any).Processor) {
    return new (Service as any).Processor(handlers)
  } else {
    return new (Service as any)(handlers)
  }
}

export function isTransportSupported(transport: TransportType): boolean {
  return supportedTransports.indexOf(transport) !== -1
}

export function isProtocolSupported(protocol: ProtocolType): boolean {
  return supportedProtocols.indexOf(protocol) !== -1
}

export function process<Context>(
  processor: IThriftProcessor<Context>,
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
