import { EventEmitter } from 'events'
import { TraceId } from 'zipkin'
import { TProtocol } from './protocols'
import { TTransport } from './transports'

export * from './Int64'

export type LogFunction = (msg: string, data?: any) => void

export interface IRequestHeaders {
    [name: string]: string | Array<string> | undefined
}

export interface IRequestContext {
    traceId: TraceId,
    usesLinkerd: boolean
    requestHeaders: { [name: string]: any }
}

/**
 * Options for any Thrift Server
 *
 * serviceName<string> - name of the service
 * handler<TProcessor> - a service processor instance for handling requests
 * transport<TransportType> - name of the transport to use
 * protocol<ProtocolType> - name of the protocol to use
 */
export interface IThriftServerOptions<TProcessor> {
    serviceName: string
    handler: TProcessor
    transport?: TransportType
    protocol?: ProtocolType
}

export interface IThriftConnection<Context = never> {
    Transport: ITransportConstructor
    Protocol: IProtocolConstructor
    send(dataToSend: Buffer, context?: Context): Promise<Buffer>
}

export abstract class ThriftConnection<Context = never> extends EventEmitter implements IThriftConnection<Context> {
    constructor(
        public Transport: ITransportConstructor,
        public Protocol: IProtocolConstructor,
    ) {
        super()
    }
    public abstract send(dataToSend: Buffer, context?: Context): Promise<Buffer>
}

export abstract class StructLike {
    public static read(input: TProtocol): StructLike {
      throw new Error('Not implemented')
    }

    public abstract write(output: TProtocol): void
}

export interface IStructCodec<LooseType, StructType> {
    encode(obj: LooseType, output: TProtocol): void
    decode(input: TProtocol): StructType
}

export interface IProtocolConstructor {
    new(trans: TTransport, strictRead?: boolean, strictWrite?: boolean): TProtocol
}

export interface ITransportConstructor {
    new(buffer?: Buffer): TTransport
    receiver(data: Buffer): TTransport
}

export interface IClientConstructor<TClient, Context> {
    new(
        connection: ThriftConnection<Context>,
    ): TClient
}

export interface IProcessorConstructor<TProcessor, THandler> {
    new(handler: THandler): TProcessor
}

export type ProtocolType =
    'binary' // | 'compact' | 'json'

export type TransportType =
    'buffered' // | 'framed'

export interface ITransportMap {
    [name: string]: ITransportConstructor
}

export interface IProtocolMap {
    [name: string]: IProtocolConstructor
}

export interface IThriftProcessor<Context> {
    process(input: TProtocol, output: TProtocol, context?: Context): Promise<Buffer>
}

export enum TType {
    STOP = 0,
    VOID = 1,
    BOOL = 2,
    BYTE = 3,
    I08 = 3,
    DOUBLE = 4,
    I16 = 6,
    I32 = 8,
    I64 = 10,
    STRING = 11,
    UTF7 = 11,
    STRUCT = 12,
    MAP = 13,
    SET = 14,
    LIST = 15,
    ENUM = 16,
    UTF8 = 16,
    UTF16 = 17,
}

export interface IThriftMap {
    keyType: TType
    valueType: TType
    size: number
}

export interface IThriftMessage {
    fieldName: string
    messageType: MessageType
    requestId: number
}

export interface IThriftField {
    fieldName: string
    fieldType: TType
    fieldId: number
}

export interface IThriftList {
    elementType: TType
    size: number
}

export interface IThriftSet {
    elementType: TType
    size: number
}

export interface IThriftStruct {
    fieldName: string
}

export enum MessageType {
    CALL = 1,
    REPLY = 2,
    EXCEPTION = 3,
    ONEWAY = 4,
}
