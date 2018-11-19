import { TraceId } from 'zipkin'
import { TProtocol } from './protocols'
import { TTransport } from './transports'

export * from './Int64'

export type LogFunction = (tags: Array<string>, data?: string | object) => void

export interface IRequestHeaders {
    [name: string]: any
}

export interface IRequestContext {
    traceId: TraceId
    headers: IRequestHeaders
}

/**
 * Options for any Thrift Server
 *
 * serviceName<string> - name of the service
 * handler<TProcessor> - a service processor instance for handling requests
 * transport<TransportType> - name of the transport to use
 * protocol<ProtocolType> - name of the protocol to use
 */
export interface IThriftServerOptions<
    Context,
    TProcessor extends IThriftProcessor<Context>
> {
    serviceName: string
    handler: TProcessor
    transport?: TransportType
    protocol?: ProtocolType
    logger?: LogFunction
}

export interface IThriftConnection<Context = void> {
    Transport: ITransportConstructor
    Protocol: IProtocolConstructor
    send(dataToSend: Buffer, context?: Context): Promise<Buffer>
}

export abstract class ThriftConnection<Context = void>
    implements IThriftConnection<Context> {
    constructor(
        public Transport: ITransportConstructor,
        public Protocol: IProtocolConstructor,
    ) {}

    public abstract send(dataToSend: Buffer, context?: Context): Promise<Buffer>
}

export interface IThriftAnnotations {
    [name: string]: string
}

export interface IFieldAnnotations {
    [fieldName: string]: IThriftAnnotations
}

export interface IMethodAnnotations {
    [methodName: string]: {
        annotations: IThriftAnnotations
        fieldAnnotations: IFieldAnnotations
    }
}

export interface IStructLike {
    readonly _annotations?: IThriftAnnotations
    readonly _fieldAnnotations?: IFieldAnnotations
    write(output: TProtocol): void
}

export abstract class StructLike implements IStructLike {
    public readonly _annotations?: IThriftAnnotations = {}
    public readonly _fieldAnnotations?: IFieldAnnotations = {}
    public abstract write(output: TProtocol): void
}

export interface IStructConstructor<T extends StructLike> {
    new (args?: any): T
    read(input: TProtocol): T
    write(data: T, output: TProtocol): void
}

export type ThriftReadCodec<ThriftType> = IStructCodec<any, ThriftType>

export type ThriftWriteCodec<ThriftType> = IStructCodec<ThriftType, any>

export interface IStructCodec<LooseType, StrictType> {
    encode(obj: LooseType, output: TProtocol): void
    decode(input: TProtocol): StrictType
}

export interface IProtocolConstructor {
    new (trans: TTransport, logger?: LogFunction): TProtocol
}

export interface ITransportConstructor {
    new (buffer?: Buffer): TTransport
    receiver(data: Buffer): TTransport
}

export interface IThriftClient {
    readonly _serviceName?: string
    readonly _annotations?: IThriftAnnotations
    readonly _fieldAnnotations?: IFieldAnnotations
    readonly _methodNames?: Array<string>
}

export abstract class ThriftClient<Context = any> implements IThriftClient {
    public readonly _annotations?: IThriftAnnotations = {}
    public readonly _fieldAnnotatons?: IFieldAnnotations = {}

    protected _requestId: number
    protected transport: ITransportConstructor
    protected protocol: IProtocolConstructor
    protected connection: IThriftConnection<Context>

    constructor(connection: IThriftConnection<Context>) {
        this._requestId = 0
        this.transport = connection.Transport
        this.protocol = connection.Protocol
        this.connection = connection
    }

    protected incrementRequestId(): number {
        return (this._requestId += 1)
    }
}

export interface IClientConstructor<TClient, Context> {
    new (connection: ThriftConnection<Context>): TClient
}

export interface IThriftProcessor<Context> {
    readonly _serviceName?: string
    readonly _annotations?: IThriftAnnotations
    readonly _methodAnnotations?: IMethodAnnotations
    readonly _methodNames?: Array<string>
    process(
        input: TProtocol,
        output: TProtocol,
        context?: Context,
    ): Promise<Buffer>
}

export abstract class ThriftProcessor<Context, IHandler>
    implements IThriftProcessor<Context> {
    public readonly _serviceName?: string
    public readonly _annotations?: IThriftAnnotations = {}
    public readonly _methodAnnotations?: IMethodAnnotations = {}
    public readonly _methodNames?: Array<string> = []

    public abstract process(
        input: TProtocol,
        output: TProtocol,
        context?: Context,
    ): Promise<Buffer>
}

export interface IProcessorConstructor<TProcessor, THandler> {
    new (handler: THandler): TProcessor
}

export type ProtocolType = 'binary' | 'compact' | 'json'

export type TransportType = 'buffered' // | 'framed'

export interface ITransportMap {
    [name: string]: ITransportConstructor
}

export interface IProtocolMap {
    [name: string]: IProtocolConstructor
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
