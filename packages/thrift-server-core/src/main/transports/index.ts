import { ITransportConstructor, ITransportMap, TransportType } from '../types'

import { BufferedTransport } from './BufferedTransport'

export * from './BufferedTransport'
// export * from './FramedTransport'
export * from './TTransport'
export * from './ThriftFrameCodec'

const transports: ITransportMap = {
    buffered: BufferedTransport,
    // framed: FramedTransport,
}

export const supportedTransports: Array<string> = Object.keys(transports)

export function isTransportSupported(transport: TransportType): boolean {
    return supportedTransports.indexOf(transport) !== -1
}

export function getTransport(
    transport: TransportType = 'buffered',
): ITransportConstructor {
    if (!isTransportSupported(transport)) {
        throw new Error(
            `Invalid transport specified. Supported values: ${supportedTransports.join(
                ', ',
            )}`,
        )
    }

    return transports[transport]
}
