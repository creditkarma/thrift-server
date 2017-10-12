import {
  TProtocol,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

export type ProtocolType =
  'binary' | 'compact' | 'json'

export type TransportType =
  'buffered' | 'framed'

export interface IPluginOptions {
  transport?: TransportType
  protocol?: ProtocolType
}

export interface ITransportMap {
  [name: string]: TTransportConstructor
}

export interface IProtocolMap {
  [name: string]: TProtocolConstructor
}

export interface IThriftProcessor<Context> {
  process(input: TProtocol, output: TProtocol, context?: Context): void
}
