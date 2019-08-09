import {
    IProtocolConstructor,
    IStructCodec,
    IThriftField,
    ITransportConstructor,
    ProtocolType,
    TransportType,
    TType,
} from '../types'

import { getProtocol, TProtocol } from '../protocols'

import { getTransport, TTransport } from '../transports'

export function readThriftObject<StrictType>(
    data: Buffer,
    ThriftCodec: IStructCodec<any, StrictType>,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Promise<[StrictType, Buffer]> {
    return new Promise((resolve, reject) => {
        const Transport: ITransportConstructor = getTransport(transportType)
        const Protocol: IProtocolConstructor = getProtocol(protocolType)
        const receiver: TTransport = new Transport(data)
        const input: TProtocol = new Protocol(receiver)
        const decoded = ThriftCodec.decode(input)

        resolve([decoded, receiver.remaining()])
    })
}

export function stripStruct(
    data: Buffer,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Buffer {
    try {
        const Transport: ITransportConstructor = getTransport(transportType)
        const Protocol: IProtocolConstructor = getProtocol(protocolType)
        const receiver: TTransport = new Transport(data)
        const input: TProtocol = new Protocol(receiver)

        input.readStructBegin()

        while (true) {
            const ret: IThriftField = input.readFieldBegin()
            const fieldType: TType = ret.fieldType
            if (fieldType === TType.STOP) {
                break
            } else {
                input.skip(fieldType)
            }
            input.readFieldEnd()
        }

        input.readStructEnd()

        return receiver.remaining()
    } catch (err) {
        return data
    }
}
