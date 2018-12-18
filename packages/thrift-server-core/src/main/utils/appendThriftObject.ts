import {
    IProtocolConstructor,
    IStructCodec,
    ITransportConstructor,
    ProtocolType,
    TransportType,
} from '../types'

import { BinaryProtocol, getProtocol, TProtocol } from '../protocols'

import { BufferedTransport, getTransport, TTransport } from '../transports'

export function encode<LooseType>(
    thriftObject: LooseType,
    ThriftCodec: IStructCodec<LooseType, any>,
    Transport: ITransportConstructor = BufferedTransport,
    Protocol: IProtocolConstructor = BinaryProtocol,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const transport: TTransport = new Transport()
        const protocol: TProtocol = new Protocol(transport)
        ThriftCodec.encode(thriftObject, protocol)
        const data = protocol.flush()
        resolve(data)
    })
}

export function appendThriftObject<LooseType>(
    value: LooseType,
    data: Buffer,
    ThriftCodec: IStructCodec<LooseType, any>,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Promise<Buffer> {
    const Transport: ITransportConstructor = getTransport(transportType)
    const Protocol: IProtocolConstructor = getProtocol(protocolType)

    return encode<LooseType>(value, ThriftCodec, Transport, Protocol).then(
        (encoded: Buffer) => {
            return Buffer.concat([encoded, data])
        },
    )
}
