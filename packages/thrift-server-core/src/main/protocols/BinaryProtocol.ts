/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/binary_protocol.js
 */
import * as binary from '../binary'

import { TProtocolException, TProtocolExceptionType } from '../errors'

import { TTransport } from '../transports'

import {
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

import { defaultLogger } from '../logger'
import { TProtocol } from './TProtocol'

// JavaScript supports only numeric doubles, therefore even hex values are always signed.
// The largest integer value which can be represented in JavaScript is +/-2^53.
// Bitwise operations convert numbers to 32 bit integers but perform sign extension
// upon assigning values back to variables.
const VERSION_MASK: number = -65536 // 0xffff0000
const VERSION_1: number = -2147418112 // 0x80010000
const TYPE_MASK: number = 0x000000ff

export class BinaryProtocol extends TProtocol {
    constructor(trans: TTransport, logger: LogFunction = defaultLogger) {
        super(trans, logger)
    }

    public writeMessageBegin(
        name: string,
        type: MessageType,
        requestId: number,
    ): void {
        this.writeI32(VERSION_1 | type)
        this.writeString(name)
        this.writeI32(requestId)

        if (this.requestId) {
            this.logger(
                ['warn', 'BinaryProtocol'],
                `requestId already set: ${name}`,
            )
        } else {
            this.requestId = requestId
        }
    }

    public writeMessageEnd(): void {
        if (this.requestId !== null) {
            this.requestId = null
        } else {
            this.logger(['warn', 'BinaryProtocol'], 'No requestId to unset')
        }
    }

    public writeStructBegin(name: string): void {}

    public writeStructEnd(): void {}

    public writeFieldBegin(name: string, type: TType, id: number): void {
        this.writeByte(type)
        this.writeI16(id)
    }

    public writeFieldEnd(): void {}

    public writeFieldStop(): void {
        this.writeByte(TType.STOP)
    }

    public writeMapBegin(keyType: TType, valueType: TType, size: number): void {
        this.writeByte(keyType)
        this.writeByte(valueType)
        this.writeI32(size)
    }

    public writeMapEnd(): void {}

    public writeListBegin(elementType: TType, size: number): void {
        this.writeByte(elementType)
        this.writeI32(size)
    }

    public writeListEnd(): void {}

    public writeSetBegin(elementType: TType, size: number): void {
        this.writeByte(elementType)
        this.writeI32(size)
    }

    public writeSetEnd(): void {}

    public writeBool(bool: boolean): void {
        if (bool) {
            this.writeByte(1)
        } else {
            this.writeByte(0)
        }
    }

    public writeByte(byte: number): void {
        if (typeof byte === 'number') {
            this.transport.write(Buffer.from([byte]))
        } else {
            throw new TypeError(`Expected number but found type ${typeof byte}`)
        }
    }

    public writeI16(i16: number): void {
        if (typeof i16 === 'number') {
            this.transport.write(binary.writeI16(Buffer.alloc(2), i16))
        } else {
            throw new TypeError(`Expected number but found type ${typeof i16}`)
        }
    }

    public writeI32(i32: number): void {
        if (typeof i32 === 'number') {
            this.transport.write(binary.writeI32(Buffer.alloc(4), i32))
        } else {
            throw new TypeError(`Expected number but found type ${typeof i32}`)
        }
    }

    public writeI64(i64: number | Int64): void {
        if (typeof i64 === 'number') {
            this.transport.write(new Int64(i64).buffer)
        } else if (typeof i64 === 'string') {
            this.transport.write(Int64.fromDecimalString(i64).buffer)
        } else if (i64 instanceof Int64) {
            this.transport.write(i64.buffer)
        } else {
            throw new TypeError(
                `Expected Int64 or number but found type ${typeof i64}`,
            )
        }
    }

    public writeDouble(dub: number): void {
        if (typeof dub === 'number') {
            this.transport.write(binary.writeDouble(Buffer.alloc(8), dub))
        } else {
            throw new TypeError(`Expected number but found type ${typeof dub}`)
        }
    }

    public writeStringOrBinary(
        name: string,
        encoding: string,
        data: string | Buffer,
    ): void {
        if (typeof data === 'string') {
            this.writeI32(Buffer.byteLength(data, encoding))
            this.transport.write(Buffer.from(data, encoding))
        } else if (data instanceof Buffer) {
            this.writeI32(data.length)
            this.transport.write(data)
        } else {
            throw new TypeError(
                `Argument of type ${typeof data} should be buffer or string`,
            )
        }
    }

    public writeString(data: string): void {
        this.writeStringOrBinary('writeString', 'utf8', data)
    }

    public writeBinary(data: string | Buffer): void {
        this.writeStringOrBinary('writeBinary', 'binary', data)
    }

    public readMessageBegin(): IThriftMessage {
        const size: number = this.readI32()

        if (size < 0) {
            const version = size & VERSION_MASK

            if (version !== VERSION_1) {
                throw new TProtocolException(
                    TProtocolExceptionType.BAD_VERSION,
                    `Bad version in readMessageBegin: ${size}`,
                )
            }

            return {
                fieldName: this.readString(),
                messageType: size & TYPE_MASK,
                requestId: this.readI32(),
            }
        } else {
            // if (this.strictRead) {
            //   throw new TProtocolException(TProtocolExceptionType.BAD_VERSION, "No protocol version header")
            // }
            return {
                fieldName: this.transport.readString(size),
                messageType: this.readByte(),
                requestId: this.readI32(),
            }
        }
    }

    public readMessageEnd(): void {}

    public readStructBegin(): IThriftStruct {
        return { fieldName: '' }
    }

    public readStructEnd(): void {}

    public readFieldBegin(): IThriftField {
        const type: TType = this.readByte()
        if (type === TType.STOP) {
            return { fieldName: '', fieldType: type, fieldId: 0 }
        } else {
            const id: number = this.readI16()
            return { fieldName: '', fieldType: type, fieldId: id }
        }
    }

    public readFieldEnd(): void {}

    public readMapBegin(): IThriftMap {
        const keyType: TType = this.readByte()
        const valueType: TType = this.readByte()
        const size: number = this.readI32()
        return { keyType, valueType, size }
    }

    public readMapEnd(): void {}

    public readListBegin(): IThriftList {
        const elementType: TType = this.readByte()
        const size: number = this.readI32()
        return { elementType, size }
    }

    public readListEnd(): void {}

    public readSetBegin(): IThriftSet {
        const elementType: TType = this.readByte()
        const size: number = this.readI32()
        return { elementType, size }
    }

    public readSetEnd(): void {}

    public readBool(): boolean {
        const byte: number = this.readByte()
        return byte !== 0
    }

    public readByte(): number {
        return this.transport.readByte()
    }

    public readI16(): number {
        return this.transport.readI16()
    }

    public readI32(): number {
        return this.transport.readI32()
    }

    public readI64(): Int64 {
        const buff = this.transport.read(8)
        return new Int64(buff)
    }

    public readDouble(): number {
        return this.transport.readDouble()
    }

    public readBinary(): Buffer {
        const len: number = this.readI32()
        if (len === 0) {
            return Buffer.alloc(0)
        } else if (len < 0) {
            throw new TProtocolException(
                TProtocolExceptionType.NEGATIVE_SIZE,
                'Negative binary size',
            )
        } else {
            return this.transport.read(len)
        }
    }

    public readString(): string {
        const len: number = this.readI32()
        if (len === 0) {
            return ''
        }

        if (len < 0) {
            throw new TProtocolException(
                TProtocolExceptionType.NEGATIVE_SIZE,
                'Negative string size',
            )
        }
        return this.transport.readString(len)
    }

    public getTransport(): TTransport {
        return this.transport
    }

    public skip(type: TType): void {
        switch (type) {
            case TType.STOP:
                return

            case TType.BOOL:
                this.readBool()
                break

            case TType.BYTE:
                this.readByte()
                break

            case TType.I16:
                this.readI16()
                break

            case TType.I32:
                this.readI32()
                break

            case TType.I64:
                this.readI64()
                break

            case TType.DOUBLE:
                this.readDouble()
                break

            case TType.STRING:
                this.readString()
                break

            case TType.STRUCT:
                this.readStructBegin()
                while (true) {
                    const fieldBegin: IThriftField = this.readFieldBegin()
                    if (fieldBegin.fieldType === TType.STOP) {
                        break
                    }
                    this.skip(fieldBegin.fieldType)
                    this.readFieldEnd()
                }
                this.readStructEnd()
                break

            case TType.MAP:
                const mapBegin: IThriftMap = this.readMapBegin()
                for (let i = 0; i < mapBegin.size; ++i) {
                    this.skip(mapBegin.keyType)
                    this.skip(mapBegin.valueType)
                }
                this.readMapEnd()
                break

            case TType.SET:
                const setBegin: IThriftSet = this.readSetBegin()
                for (let i2 = 0; i2 < setBegin.size; ++i2) {
                    this.skip(setBegin.elementType)
                }
                this.readSetEnd()
                break

            case TType.LIST:
                const listBegin: IThriftList = this.readListBegin()
                for (let i3 = 0; i3 < listBegin.size; ++i3) {
                    this.skip(listBegin.elementType)
                }
                this.readListEnd()
                break

            default:
                throw new Error('Invalid type: ' + type)
        }
    }
}
