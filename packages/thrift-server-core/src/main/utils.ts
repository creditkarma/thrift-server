import { BinaryProtocol } from './protocols'
import { BufferedTransport } from './transports'

import {
    IProtocolConstructor,
    IProtocolMap,
    ITransportConstructor,
    ITransportMap,
    ProtocolType,
    TransportType,
} from './types'

const transports: ITransportMap = {
    buffered: BufferedTransport,
    // framed: FramedTransport,
}

export const supportedTransports: Array<string> = Object.keys(transports)

const protocols: IProtocolMap = {
    binary: BinaryProtocol,
    // compact: CompactProtocol,
    // json: JSONProtocol,
}

export const supportedProtocols: Array<string> = Object.keys(protocols)

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
