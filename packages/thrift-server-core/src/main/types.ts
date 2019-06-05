import { TProtocol } from './protocols'
import { TTransport } from './transports'

export * from './Int64'

export type LogFunction = (tags: Array<string>, data?: string | object) => void

export type RequestHeaders = Record<string, any>

export interface IReadResult {
    methodName: string
    requestId: number
    data: any
}

export interface ITraceId {
    readonly spanId: string
    readonly parentId: string
    readonly traceId: string
    readonly sampled?: boolean
    readonly traceIdHigh?: boolean
}

export interface IRequest {
    headers: RequestHeaders
}

export interface IRequestContext {
    headers?: RequestHeaders
    traceId?: ITraceId
    log?: LogFunction
}

export interface IThriftContext {
    headers: RequestHeaders
    log: LogFunction
    getClient: ClientFactory
}

export type ContextFunction<BaseRequest, RequestContext> = (
    req: BaseRequest,
) => Promise<RequestContext>

export type ClientFactory = (clientName: string, args?: object) => IThriftClient

export type LogFactory<RawRequest> = (request: RawRequest) => LogFunction

/**
 * Options for any Thrift Server
 *
 * serviceName<string> - name of the service
 * handler<TProcessor> - a service processor instance for handling requests
 * transport<TransportType> - name of the transport to use
 * protocol<ProtocolType> - name of the protocol to use
 */
export interface IThriftServerOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends IThriftContext = IThriftContext,
    RawRequest extends IRequest = IRequest
> {
    serviceName: string
    handler: TProcessor
    transport?: TransportType
    protocol?: ProtocolType
    withEndpointPerMethod?: boolean

    mapResponse?: any

    logFactory?: LogFactory<RawRequest>

    clientFactory?: ClientFactory
    // formatContext?: ContextFunction<RequestContext>
}

export interface IThriftServiceContext<
    Context extends IThriftContext = IThriftContext
> {
    serviceName: string
    transport: TransportType
    protocol: ProtocolType
    processor: IThriftProcessor<Context>
}

export interface IThriftConnection<Context extends IRequestContext> {
    Transport: ITransportConstructor
    Protocol: IProtocolConstructor
    send(dataToSend: Buffer, context?: Context): Promise<Buffer>
}

export interface IStructConstructor<T extends IStructLike> {
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

export interface IStructToolkit<LooseType, StrictType>
    extends IStructCodec<LooseType, StrictType> {
    create(args: LooseType): StrictType
}

export type IProtocolConstructor = new (
    transport: TTransport,
    logger?: LogFunction,
) => TProtocol

export interface ITransportConstructor {
    new (buffer?: Buffer): TTransport
    receiver(data: Buffer): TTransport
}

export interface IThriftAnnotations {
    readonly [name: string]: string
}

export const enum DefinitionMetadataType {
    StructType = 'StructType',
    BaseType = 'BaseType',
}

export type DefinitionMetadata = IStructMetadata | IBaseMetadata

export interface IStructMetadata {
    readonly type: DefinitionMetadataType.StructType
    readonly name: string
    readonly annotations: IThriftAnnotations
    readonly fields: IFieldMetadataMap
}

export interface IBaseMetadata {
    readonly type: DefinitionMetadataType.BaseType
}

export interface IFieldMetadataMap {
    [fieldName: string]: IFieldMetadata
}

export interface IFieldMetadata {
    readonly name: string
    readonly fieldId: number
    readonly annotations: IThriftAnnotations
    readonly definitionType: DefinitionMetadata
}

export interface IMethodMetadata {
    [methodName: string]: {
        readonly name: string
        readonly annotations: IThriftAnnotations
        readonly arguments: Array<IFieldMetadata>
    }
}

export interface IServiceMetadata {
    readonly name: string
    readonly annotations: IThriftAnnotations
    readonly methods: IMethodMetadata
}

export interface IStructLike {
    write(output: TProtocol): void
}

export interface IThriftClient {
    readonly __metadata: IServiceMetadata
}

export interface IClientConstructor<
    TClient extends IThriftClient,
    Context extends IRequestContext = IRequestContext
> {
    readonly metadata: IServiceMetadata
    new (connection: IThriftConnection<Context>): TClient
}

export interface IThriftProcessor<Context extends IThriftContext> {
    readonly __metadata: IServiceMetadata

    process(data: Buffer, context: Context): Promise<Buffer>

    readRequest(data: Buffer): IReadResult
}

export interface IProcessorConstructor<TProcessor, THandler> {
    readonly metadata: IServiceMetadata
    new (
        handler: THandler,
        transport?: ITransportConstructor,
        protocol?: IProtocolConstructor,
    ): TProcessor
}

export type ProtocolType = 'binary' | 'compact' | 'json'

export type TransportType = 'buffered'

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
