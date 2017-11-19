import {
  Int64,
  TProtocol,
  TProtocolConstructor,
  TTransport,
  TTransportConstructor,
} from 'thrift'

export { Int64 as Int64 }
export { TProtocol as TProtocol }
export { TTransport as TTransport }

export type ProtocolType =
  'binary' | 'compact' | 'json'

export type TransportType =
  'buffered' | 'framed'

export interface ITransportMap {
  [name: string]: TTransportConstructor
}

export interface IProtocolMap {
  [name: string]: TProtocolConstructor
}

export interface IThriftProcessor<Context> {
  process(input: TProtocol, output: TProtocol, context?: Context): void
}
