import { TTransport } from '../transports'

import { defaultLogger } from '../logger'
import {
    IInt64,
    Int64,
    IThriftField,
    IThriftList,
    IThriftMap,
    IThriftMessage,
    IThriftSet,
    IThriftStruct,
    LogFunction,
    MessageType,
    TType,
} from '../types'

export type I64Type = 'int64' | 'bigint'

export abstract class TProtocol {
    protected transport: TTransport
    protected logger: LogFunction
    protected requestId: number | null

    constructor(trans: TTransport, logger: LogFunction = defaultLogger) {
        this.transport = trans
        this.logger = logger
        this.requestId = null
    }

    public getTransport(): TTransport {
        return this.transport
    }

    public flush(): Buffer {
        return this.transport.flush()
    }

    public abstract writeMessageBegin(
        name: string,
        type: MessageType,
        seqid: number,
    ): void

    public abstract writeMessageEnd(): void

    public abstract writeStructBegin(name: string): void

    public abstract writeStructEnd(): void

    public abstract writeFieldBegin(name: string, type: TType, id: number): void

    public abstract writeFieldEnd(): void

    public abstract writeFieldStop(): void

    public abstract writeMapBegin(
        keyType: TType,
        valueType: TType,
        size: number,
    ): void

    public abstract writeMapEnd(): void

    public abstract writeListBegin(elementType: TType, size: number): void

    public abstract writeListEnd(): void

    public abstract writeSetBegin(elementType: TType, size: number): void

    public abstract writeSetEnd(): void

    public abstract writeBool(bool: boolean): void

    public abstract writeByte(b: number): void

    public abstract writeI16(i16: number): void

    public abstract writeI32(i32: number): void

    public abstract writeI64(i64: number | string | bigint | IInt64): void

    public abstract writeDouble(dbl: number): void

    public abstract writeString(arg: string): void

    public abstract writeBinary(arg: string | Buffer): void

    public abstract readMessageBegin(): IThriftMessage

    public abstract readMessageEnd(): void

    public abstract readStructBegin(): IThriftStruct

    public abstract readStructEnd(): void

    public abstract readFieldBegin(): IThriftField

    public abstract readFieldEnd(): void

    public abstract readMapBegin(): IThriftMap

    public abstract readMapEnd(): void

    public abstract readListBegin(): IThriftList

    public abstract readListEnd(): void

    public abstract readSetBegin(): IThriftSet

    public abstract readSetEnd(): void

    public abstract readBool(): boolean

    public abstract readByte(): number

    public abstract readI16(): number

    public abstract readI32(): number

    public abstract readI64<T extends I64Type = 'int64'>(
        type?: T,
    ): T extends 'bigint' ? bigint : Int64

    public abstract readDouble(): number

    public abstract readBinary(): Buffer

    public abstract readString(): string

    public abstract skip(type: TType): void
}
