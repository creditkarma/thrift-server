import * as Core from '@creditkarma/thrift-server-core'

export class NullConnection implements Core.IThriftConnection<any> {
    constructor(
        public Transport: Core.ITransportConstructor,
        public Protocol: Core.IProtocolConstructor,
    ) {}

    public send(dataToSend: Buffer, context: any = {}): Promise<Buffer> {
        return Promise.reject(new Error(`Not implemented`))
    }
}
