import {
  TTransportConstructor,
  TProtocolConstructor,
} from 'thrift'

export interface IHttpConnectionOptions {
  hostName: string
  port: number
  transport?: TTransportConstructor
  protocol?: TProtocolConstructor
}

export interface IHttpConnection {
  transport: TTransportConstructor
  protocol: TProtocolConstructor
  write(dataToWrite: Buffer): Promise<Buffer>
}
