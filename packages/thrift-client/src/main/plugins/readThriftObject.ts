import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IStructCodec,
    ITransportConstructor,
    ProtocolType,
    TProtocol,
    TransportType,
    TTransport,
} from '@creditkarma/thrift-server-core'

export function readThriftObject<StrictType>(
    data: Buffer,
    ThriftCodec: IStructCodec<any, StrictType>,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Promise<[StrictType, Buffer]> {
    const Transport: ITransportConstructor = getTransport(transportType)
    const Protocol: IProtocolConstructor = getProtocol(protocolType)

    return new Promise((resolve, reject) => {
        const receiver: TTransport = new Transport(data)
        const input: TProtocol = new Protocol(receiver)
        const decoded = ThriftCodec.decode(input)
        resolve([ decoded, receiver.remaining() ])
    })
}
