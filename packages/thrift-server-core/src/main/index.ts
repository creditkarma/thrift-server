import { BinaryProtocol } from './protocols'
import { BufferedTransport } from './transports'

import { InputBufferUnderrunError } from './errors'

import {
  IProtocolConstructor,
  IProtocolMap,
  IThriftProcessor,
  ITransportConstructor,
  ITransportMap,
  ProtocolType,
  TransportType,
} from './types'

export * from './types'
export * from './protocols'
export * from './transports'
export * from './errors'

const transports: ITransportMap = {
    buffered: BufferedTransport,
    // framed: FramedTransport,
}

export const supportedTransports: string[] = Object.keys(transports)

const protocols: IProtocolMap = {
    binary: BinaryProtocol,
    // compact: CompactProtocol,
    // json: JSONProtocol,
}

export const supportedProtocols: string[] = Object.keys(protocols)

export function getTransport(transport: TransportType = 'buffered'): ITransportConstructor {
    if (!isTransportSupported(transport)) {
        throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
    }

    return transports[transport]
}

export function getProtocol(protocol: ProtocolType = 'binary'): IProtocolConstructor {
    if (protocol && !isProtocolSupported(protocol)) {
        throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
    }

    return protocols[protocol]
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
    Transport: ITransportConstructor,
    Protocol: IProtocolConstructor,
    context?: Context,
): Promise<Buffer> {
    const transportWithData = new Transport(buffer);
    (transportWithData as any).writeCursor = buffer.length

    const input = new Protocol(transportWithData)

    return new Promise((resolve, reject) => {
        const output = new Protocol(new Transport())
        processor.process(input, output, context).then((result: Buffer) => {
            resolve(result)
            transportWithData.commitPosition()
        }, (err: any) => {
            if (err instanceof InputBufferUnderrunError) {
                transportWithData.rollbackPosition()
            }
            reject(err)
        })
    })
}
