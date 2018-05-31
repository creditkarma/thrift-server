import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IStructConstructor,
    ITransportConstructor,
    ProtocolType,
    StructLike,
    TProtocol,
    TransportType,
    TTransport,
} from '@creditkarma/thrift-server-core'

export function readThriftObject<T extends StructLike>(
    data: Buffer,
    ThriftClass: IStructConstructor<T>,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): Promise<[T, Buffer]> {
    const Transport: ITransportConstructor = getTransport(transportType)
    const Protocol: IProtocolConstructor = getProtocol(protocolType)

    return new Promise((resolve, reject) => {
        const receiver: TTransport = new Transport(data)
        const input: TProtocol = new Protocol(receiver)
        const decoded = ThriftClass.read(input)
        resolve([ decoded, receiver.remaining() ])
    })
}
