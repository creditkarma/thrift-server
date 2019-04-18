import { IProtocolConstructor, IProtocolMap, ProtocolType } from '../types'

import { BinaryProtocol } from './BinaryProtocol'

import { CompactProtocol } from './CompactProtocol'

import { JSONProtocol } from './JSONProtocol'

export * from './BinaryProtocol'
export * from './CompactProtocol'
export * from './JSONProtocol'
export * from './TProtocol'

const protocols: IProtocolMap = {
    binary: BinaryProtocol,
    compact: CompactProtocol,
    json: JSONProtocol,
}

export const supportedProtocols: Array<keyof IProtocolMap> = Object.keys(
    protocols,
)

export function isProtocolSupported(protocol: ProtocolType): boolean {
    return supportedProtocols.indexOf(protocol) !== -1
}

export function getProtocol(
    protocol: ProtocolType = 'binary',
): IProtocolConstructor {
    if (protocol && !isProtocolSupported(protocol)) {
        throw new Error(
            `Invalid protocol specified. Supported values: ${supportedProtocols.join(
                ', ',
            )}`,
        )
    }

    return protocols[protocol]
}
