import { defaultLogger } from '../logger'

import {
    IProtocolConstructor,
    IThriftMessage,
    ITransportConstructor,
    LogFunction,
} from '../types'

import { BinaryProtocol, TProtocol } from '../protocols'

import { BufferedTransport, TTransport } from '../transports'

export function readThriftMetadata(
    buffer: Buffer,
    Transport: ITransportConstructor,
    Protocol: IProtocolConstructor,
    logger: LogFunction,
): IThriftMessage {
    try {
        const transportWithData: TTransport = new Transport(buffer)
        const input: TProtocol = new Protocol(transportWithData)
        return input.readMessageBegin()
    } catch (err) {
        logger(['warn'], `Unable to read Thrift message. ${err.message}`)
        throw err
    }
}

export function readThriftMethod(
    buffer: Buffer,
    Transport: ITransportConstructor = BufferedTransport,
    Protocol: IProtocolConstructor = BinaryProtocol,
    logger: LogFunction = defaultLogger,
): string {
    try {
        const { fieldName } = readThriftMetadata(
            buffer,
            Transport,
            Protocol,
            logger,
        )
        return fieldName
    } catch (err) {
        logger(['warn'], `Unable to read Thrift method name. ${err.message}`)
        return ''
    }
}

export function readRequestId(
    buffer: Buffer,
    Transport: ITransportConstructor,
    Protocol: IProtocolConstructor,
    logger: LogFunction = defaultLogger,
): number {
    try {
        const { requestId } = readThriftMetadata(
            buffer,
            Transport,
            Protocol,
            logger,
        )
        return requestId
    } catch (err) {
        logger(['warn'], `Unable to read Thrift requestId. ${err.message}`)
        return 0
    }
}
