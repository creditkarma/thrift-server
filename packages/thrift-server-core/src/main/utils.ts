import * as url from 'url'
import * as logger from './logger'
import {
    BinaryProtocol,
    CompactProtocol,
    JSONProtocol,
    TProtocol,
} from './protocols'
import { BufferedTransport, TTransport } from './transports'

import {
    IProtocolConstructor,
    IProtocolMap,
    ITransportConstructor,
    ITransportMap,
    ProtocolType,
    TransportType,
} from './types'

export function readThriftMethod(
    buffer: Buffer,
    Transport: ITransportConstructor = BufferedTransport,
    Protocol: IProtocolConstructor = BinaryProtocol,
): string {
    try {
        const transportWithData: TTransport = new Transport(buffer)
        const input: TProtocol = new Protocol(transportWithData)
        const metadata = input.readMessageBegin()

        return metadata.fieldName
    } catch (err) {
        logger.log(`Unable to read Thrift method name. ${err.message}`)
        return ''
    }
}

const transports: ITransportMap = {
    buffered: BufferedTransport,
    // framed: FramedTransport,
}

export const supportedTransports: Array<string> = Object.keys(transports)

const protocols: IProtocolMap = {
    binary: BinaryProtocol,
    compact: CompactProtocol,
    json: JSONProtocol,
}

export const supportedProtocols: Array<string> = Object.keys(protocols)

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

export function isTransportSupported(transport: TransportType): boolean {
    return supportedTransports.indexOf(transport) !== -1
}

export function isProtocolSupported(protocol: ProtocolType): boolean {
    return supportedProtocols.indexOf(protocol) !== -1
}

function isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object'
}

export function deepMerge<Base, Update>(
    base: Base,
    update: Update,
): Base & Update {
    const newObj: any = {}
    const baseKeys: Array<string> = Object.keys(base)
    const updateKeys: Array<string> = Object.keys(update)

    for (const key of updateKeys) {
        if (baseKeys.indexOf(key) === -1) {
            baseKeys.push(key)
        }
    }

    for (const key of baseKeys) {
        if (base.hasOwnProperty(key) || update.hasOwnProperty(key)) {
            const baseValue: any = (base as any)[key]
            const updateValue: any = (update as any)[key]

            if (isObject(baseValue) && isObject(updateValue)) {
                newObj[key] = deepMerge(baseValue, updateValue)
            } else if (updateValue !== undefined) {
                newObj[key] = updateValue
            } else {
                newObj[key] = baseValue
            }
        }
    }

    return newObj as Base & Update
}

export function formatUrl(requestUrl: string): string {
    const parsed = url.parse(url.format(requestUrl))

    if (!parsed.pathname) {
        return `${parsed.hostname || ''}/`
    } else {
        return `${parsed.hostname || ''}${parsed.pathname}`
    }
}
