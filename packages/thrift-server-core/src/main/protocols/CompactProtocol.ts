/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/compact_protocol.js
 */
import {
    TProtocolException,
    TProtocolExceptionType,
} from '../errors'

import { defaultLogger } from '../logger'
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

import { TProtocol } from './TProtocol'

const POW_8 = Math.pow(2, 8)
const POW_24 = Math.pow(2, 24)
const POW_32 = Math.pow(2, 32)
const POW_40 = Math.pow(2, 40)
const POW_48 = Math.pow(2, 48)
const POW_52 = Math.pow(2, 52)
const POW_1022 = Math.pow(2, 1022)

// Compact Protocol ID number.
const PROTOCOL_ID = -126  // 1000 0010

// Compact Protocol version number.
const VERSION_N = 1

// Compact Protocol version mask for combining protocol version and message type in one byte
const VERSION_MASK = 0x1f // 0001 1111

// Compact Protocol message type mask for combining protocol version and message type in one byte.
const TYPE_MASK = -32     // 1110 0000

// Compact Protocol message type bits for ensuring message type bit size.
const TYPE_BITS = 7 // 0000 0111

// Compact Protocol message type shift amount for combining protocol version and message type in one byte.
const TYPE_SHIFT_AMOUNT = 5

/**
 * Compact Protocol type IDs used to keep type data within one nibble.
 * @readonly
 * @property {number}  STOP          - End of a set of fields.
 * @property {number}  BOOLEAN_TRUE  - Flag for Boolean field with true value (packed field and value).
 * @property {number}  BOOLEAN_FALSE - Flag for Boolean field with false value (packed field and value).
 * @property {number}  BYTE          - Signed 8 bit integer.
 * @property {number}  I16           - Signed 16 bit integer.
 * @property {number}  I32           - Signed 32 bit integer.
 * @property {number}  I64           - Signed 64 bit integer (2^53 max in JavaScript).
 * @property {number}  DOUBLE        - 64 bit IEEE 854 floating point.
 * @property {number}  BINARY        - Array of bytes (used for strings also).
 * @property {number}  LIST          - A collection type (unordered).
 * @property {number}  SET           - A collection type (unordered and without repeated values).
 * @property {number}  MAP           - A collection type (map/associative-array/dictionary).
 * @property {number}  STRUCT        - A multifield type.
 */
export enum CompactType {
    STOP =           0x00,
    BOOLEAN_TRUE =   0x01,
    BOOLEAN_FALSE =  0x02,
    BYTE =           0x03,
    I16 =            0x04,
    I32 =            0x05,
    I64 =            0x06,
    DOUBLE =         0x07,
    BINARY =         0x08,
    LIST =           0x09,
    SET =            0x0A,
    MAP =            0x0B,
    STRUCT =         0x0C,
}

/**
 * Array mapping Compact type IDs to standard Thrift type IDs.
 * @readonly
 */
const TTypeToCType: Array<CompactType> = [
    CompactType.STOP,         // T_STOP
    0,                                      // unused
    CompactType.BOOLEAN_TRUE, // T_BOOL
    CompactType.BYTE,         // T_BYTE
    CompactType.DOUBLE,       // T_DOUBLE
    0,                                      // unused
    CompactType.I16,          // T_I16
    0,                                      // unused
    CompactType.I32,          // T_I32
    0,                                      // unused
    CompactType.I64,          // T_I64
    CompactType.BINARY,       // T_STRING
    CompactType.STRUCT,       // T_STRUCT
    CompactType.MAP,          // T_MAP
    CompactType.SET,          // T_SET
    CompactType.LIST,         // T_LIST
]

export class CompactProtocol extends TProtocol {
    private _lastField: Array<any>
    private _lastFieldId: number
    private _booleanField: any
    private _boolValue: any

    constructor(trans: TTransport, logger: LogFunction = defaultLogger) {
        super(trans, logger)
        this._lastField = []
        this._lastFieldId = 0
        this._booleanField = {
            name: null,
            hasBoolValue: false,
        }
        this._boolValue = {
            hasBoolValue: false,
            boolValue: false,
        }
    }

    public getCompactType(ttype: TType): CompactType {
        return TTypeToCType[ttype]
    }

    public getTType = function(type: CompactType): TType {
        switch (type) {
            case CompactType.STOP:
                return TType.STOP
            case CompactType.BOOLEAN_FALSE:
            case CompactType.BOOLEAN_TRUE:
                return TType.BOOL
            case CompactType.BYTE:
                return TType.BYTE
            case CompactType.I16:
                return TType.I16
            case CompactType.I32:
                return TType.I32
            case CompactType.I64:
                return TType.I64
            case CompactType.DOUBLE:
                return TType.DOUBLE
            case CompactType.BINARY:
                return TType.STRING
            case CompactType.LIST:
                return TType.LIST
            case CompactType.SET:
                return TType.SET
            case CompactType.MAP:
                return TType.MAP
            case CompactType.STRUCT:
                return TType.STRUCT
            default:
                throw new TProtocolException(TProtocolExceptionType.INVALID_DATA, `Unknown type: ${type}`)
        }
    }

    public writeMessageBegin(name: string, type: MessageType, requestId: number): void {
        this.writeByte(PROTOCOL_ID)
        this.writeByte((VERSION_N & VERSION_MASK) | ((type << TYPE_SHIFT_AMOUNT) & TYPE_MASK))
        this.writeVarint32(requestId)
        this.writeString(name)

        // Record client seqid to find callback again
        if (this.requestId) {
          this.logger([ 'warn' ], `[CompactProtocol] requestId already set: ${name}`)

        } else {
          this.requestId = requestId
        }
    }

    public writeMessageEnd(): void {
        if (this.requestId !== null) {
            this.requestId = null

        } else {
            this.logger([ 'warn' ], '[CompactProtocol] no requestId to unset')
        }
    }

    public writeStructBegin(name: string): void {
        this._lastField.push(this._lastFieldId)
        this._lastFieldId = 0
    }

    public writeStructEnd(): void {
        this._lastFieldId = this._lastField.pop()
    }

    /**
     * Writes a struct field header
     * @param {string} name - The field name (not written with the compact protocol).
     * @param {number} type - The field data type (a normal Thrift field Type).
     * @param {number} id - The IDL field Id.
     */
    public writeFieldBegin(name: string, type: TType, id: number): void {
        if (type !== TType.BOOL) {
            return this.writeFieldBeginInternal(name, type, id, -1)

        } else {
            this._booleanField.name = name
            this._booleanField.fieldType = type
            this._booleanField.fieldId = id
        }
    }

    public writeFieldEnd(): void {}

    public writeFieldStop(): void {
        this.writeByte(CompactType.STOP)
    }

    public writeMapBegin(keyType: TType, valueType: TType, size: number): void {
        if (size === 0) {
            this.writeByte(0)

        } else {
            this.writeVarint32(size)
            this.writeByte(this.getCompactType(keyType) << 4 | this.getCompactType(valueType))
        }
    }

    public writeMapEnd() {}

    public writeListBegin(elementType: TType, size: number): void {
        this.writeCollectionBegin(elementType, size)
    }

    public writeListEnd() {}

    public writeSetBegin(elementType: TType, size: number): void {
        this.writeCollectionBegin(elementType, size)
    }

    public writeSetEnd(): void {}

    public writeBool(bool: boolean): void {
        if (this._booleanField.name !== null) {
            // we haven't written the field header yet
            this.writeFieldBeginInternal(
                this._booleanField.name,
                this._booleanField.fieldType,
                this._booleanField.fieldId,
                (bool ? CompactType.BOOLEAN_TRUE : CompactType.BOOLEAN_FALSE),
            )

            this._booleanField.name = null

        } else {
          // we're not part of a field, so just write the value
          this.writeByte((bool ? CompactType.BOOLEAN_TRUE : CompactType.BOOLEAN_FALSE))
        }
    }

    public writeByte(byte: number): void {
        this.transport.write(new Buffer([byte]))
    }

    public writeI16(i16: number): void {
        this.writeVarint32(this.i32ToZigzag(i16))
    }

    public writeI32(i32: number): void {
        this.writeVarint32(this.i32ToZigzag(i32))
    }

    public writeI64(i64: number): void {
        this.writeVarint64(this.i64ToZigzag(i64))
    }

    // Little-endian, unlike TBinaryProtocol
    public writeDouble(dub: number): void {
        const buff = new Buffer(8)
        let m
        let e
        let c

        buff[7] = (dub < 0 ? 0x80 : 0x00)

        dub = Math.abs(dub)
        if (dub !== dub) {
            // NaN, use QNaN IEEE format
            m = 2251799813685248
            e = 2047

        } else if (dub === Infinity) {
            m = 0
            e = 2047

        } else {
            e = Math.floor(Math.log(dub) / Math.LN2)
            c = Math.pow(2, -e)
            if (dub * c < 1) {
                e--
                c *= 2
            }

            if (e + 1023 >= 2047) {
                // Overflow
                m = 0
                e = 2047

            } else if (e + 1023 >= 1) {
                // Normalized - term order matters, as Math.pow(2, 52-e) and v*Math.pow(2, 52) can overflow
                m = ((dub * c) - 1) * POW_52
                e += 1023

            } else {
                // Denormalized - also catches the '0' case, somewhat by chance
                m = (dub * POW_1022) * POW_52
                e = 0
            }
        }

        buff[6] = (e << 4) & 0xf0
        buff[7] |= (e >> 4) & 0x7f

        buff[0] = m & 0xff
        m = Math.floor(m / POW_8)
        buff[1] = m & 0xff
        m = Math.floor(m / POW_8)
        buff[2] = m & 0xff
        m = Math.floor(m / POW_8)
        buff[3] = m & 0xff
        m >>= 8
        buff[4] = m & 0xff
        m >>= 8
        buff[5] = m & 0xff
        m >>= 8
        buff[6] |= m & 0x0f

        this.transport.write(buff)
    }

    public writeStringOrBinary(name: string, encoding: string, data: string | Buffer): void {
        if (typeof data === 'string') {
            this.writeVarint32(Buffer.byteLength(data, encoding))
            this.transport.write(new Buffer(data, encoding))

        } else if (data instanceof Buffer || Object.prototype.toString.call(data) === '[object Uint8Array]') {
            // Buffers in Node.js under Browserify may extend UInt8Array instead of
            // defining a new object. We detect them here so we can write them
            // correctly
            this.writeVarint32(data.length)
            this.transport.write(data)

        } else {
            throw new Error(`${name} called without a string/Buffer argument: ${data}`)
        }
    }

    public writeString(data: string): void {
        this.writeStringOrBinary('writeString', 'utf8', data)
    }

    public writeBinary(data: string | Buffer): void {
        this.writeStringOrBinary('writeBinary', 'binary', data)
    }

    public readMessageBegin(): IThriftMessage {
        // Read protocol ID
        const protocolId: number = this.transport.readByte()
        if (protocolId !== PROTOCOL_ID) {
            throw new TProtocolException(TProtocolExceptionType.BAD_VERSION, `Bad protocol identifier ${protocolId}`)

        } else {
            // Read Version and Type
            const versionAndType: number = this.transport.readByte()
            const version: number = (versionAndType & VERSION_MASK)

            if (version !== VERSION_N) {
                throw new TProtocolException(TProtocolExceptionType.BAD_VERSION, `Bad protocol version ${version}`)
            }

            const messageType: number = ((versionAndType >> TYPE_SHIFT_AMOUNT) & TYPE_BITS)

            // Read SeqId
            const requestId: number = this.readVarint32()

            // Read name
            const fieldName: string = this.readString()

            return {
                fieldName,
                messageType,
                requestId,
            }
        }
    }

    public readMessageEnd(): void {}

    public readStructBegin(): IThriftStruct {
        this._lastField.push(this._lastFieldId)
        this._lastFieldId = 0
        return { fieldName: '' }
    }

    public readStructEnd(): void {
        this._lastFieldId = this._lastField.pop()
    }

    public readFieldBegin(): IThriftField {
        let fieldId: number = 0
        const byte: number = this.transport.readByte()
        const type: number = (byte & 0x0f)

        if (type === CompactType.STOP) {
            return {
                fieldName: '',
                fieldType: TType.STOP,
                fieldId,
            }

        } else {
            // Mask off the 4 MSB of the type header to check for field id delta.
            const modifier: number = ((byte & 0x000000f0) >>> 4)
            if (modifier === 0) {
                // If not a delta read the field id.
                fieldId = this.readI16()

            } else {
                // Recover the field id from the delta
                fieldId = (this._lastFieldId + modifier)
            }

            const fieldType: number = this.getTType(type)

            // Boolean are encoded with the type
            if (type === CompactType.BOOLEAN_TRUE || type === CompactType.BOOLEAN_FALSE) {
                this._boolValue.hasBoolValue = true
                this._boolValue.boolValue =
                (type === CompactType.BOOLEAN_TRUE ? true : false)
            }

            // Save the new field for the next delta computation.
            this._lastFieldId = fieldId

            return {
                fieldName: '',
                fieldType,
                fieldId,
            }
        }
    }

    public readFieldEnd() {}

    public readMapBegin(): IThriftMap {
        const size: number = this.readVarint32()
        if (size < 0) {
            throw new TProtocolException(TProtocolExceptionType.NEGATIVE_SIZE, `Negative map size`)

        } else {
            let kvType: number = 0
            if (size !== 0) {
                kvType = this.transport.readByte()
            }

            const keyType: number = this.getTType((kvType & 0xf0) >>> 4)
            const valueType: number = this.getTType(kvType & 0xf)

            return { keyType, valueType, size }
        }
    }

    public readMapEnd(): void {}

    public readListBegin(): IThriftList {
        const sizeType: number = this.transport.readByte()

        let size: number = (sizeType >>> 4) & 0x0000000f
        if (size === 15) {
            size = this.readVarint32()
        }

        if (size < 0) {
            throw new TProtocolException(TProtocolExceptionType.NEGATIVE_SIZE, `Negative list size`)

        } else {
            const elementType = this.getTType(sizeType & 0x0000000f)
            return { elementType, size }
        }
    }

    public readListEnd(): void {}

    public readSetBegin(): IThriftSet {
        return this.readListBegin()
    }

    public readSetEnd(): void {}

    public readBool(): boolean {
        let value: boolean = false
        if (this._boolValue.hasBoolValue === true) {
            value = this._boolValue.boolValue
            this._boolValue.hasBoolValue = false

        } else {
            const res: number = this.transport.readByte()
            // value = (res.value === CompactType.BOOLEAN_TRUE);
            value = (res === CompactType.BOOLEAN_TRUE)
        }

        return value
    }

      public readByte(): number {
        return this.transport.readByte()
      }

      public readI16(): number {
        return this.readI32()
      }

      public readI32(): number {
        return this.zigzagToI32(this.readVarint32())
      }

      public readI64(): Int64 {
        return this.zigzagToI64(this.readVarint64())
      }

      // Little-endian, unlike TBinaryProtocol
      public readDouble(): number {
        const buff: Buffer = this.transport.read(8)
        const off: number = 0

        const signed: number = buff[off + 7] & 0x80
        let e: number = (buff[off + 6] & 0xF0) >> 4
        e += (buff[off + 7] & 0x7F) << 4

        let m = buff[off]
        m += buff[off + 1] << 8
        m += buff[off + 2] << 16
        m += buff[off + 3] * POW_24
        m += buff[off + 4] * POW_32
        m += buff[off + 5] * POW_40
        m += (buff[off + 6] & 0x0F) * POW_48

        switch (e) {
            case 0:
                e = -1022
                break
            case 2047:
                return m ? NaN : (signed ? -Infinity : Infinity)
            default:
                m += POW_52
                e -= 1023
        }

        if (signed) {
            m *= -1
        }

        return m * Math.pow(2, e - 52)
    }

    public readBinary(): Buffer {
        const size: number = this.readVarint32()
        if (size === 0) {
            return new Buffer(0)
        } else if (size < 0) {
            throw new TProtocolException(TProtocolExceptionType.NEGATIVE_SIZE, `Negative binary size`)
        } else {
            return this.transport.read(size)
        }
    }

    public readString(): string {
        const size: number = this.readVarint32()

        // Catch empty string case
        if (size === 0) {
            return ''

        } else {
            // Catch error cases
            if (size < 0) {
                throw new TProtocolException(TProtocolExceptionType.NEGATIVE_SIZE, `Negative string size`)
            }

            return this.transport.readString(size)
        }
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
                throw new  Error('Invalid type: ' + type)
        }
    }

    /**
     * Send any buffered bytes to the end point.
     */
    public flush(): Buffer {
        return this.transport.flush()
    }

    /**
     * Convert from zigzag int to int.
     */
    private zigzagToI32(i32: number): number {
        return (i32 >>> 1) ^ (-1 * (i32 & 1))
    }

    /**
     * Convert from zigzag long to long.
     */
    private zigzagToI64(i64: Int64): Int64 {
        let hi = i64.buffer.readUInt32BE(0, true)
        let lo = i64.buffer.readUInt32BE(4, true)

        const neg = new Int64(hi & 0, lo & 1)
        neg._2scomp()
        const hiNeg = neg.buffer.readUInt32BE(0, true)
        const loNeg = neg.buffer.readUInt32BE(4, true)

        const hiLo = (hi << 31)
        hi = (hi >>> 1) ^ (hiNeg)
        lo = ((lo >>> 1) | hiLo) ^ (loNeg)
        return new Int64(hi, lo)
    }

    /**
     * Read an i32 from the wire as a varint. The MSB of each byte is set
     * if there is another byte to follow. This can read up to 5 bytes.
     */
    private readVarint32(): number {
        return this.readVarint64().toNumber()
    }

    /**
     * Read an i64 from the wire as a proper varint. The MSB of each byte is set
     * if there is another byte to follow. This can read up to 10 bytes.
     */
    private readVarint64(): Int64 {
        let rsize: number = 0
        let lo: number = 0
        let hi: number = 0
        let shift: number = 0

        while (true) {
            const b: number = this.transport.readByte()
            rsize ++

            if (shift <= 25) {
                lo = lo | ((b & 0x7f) << shift)
            } else if (25 < shift && shift < 32) {
                lo = lo | ((b & 0x7f) << shift)
                hi = hi | ((b & 0x7f) >>> (32 - shift))
            } else {
                hi = hi | ((b & 0x7f) << (shift - 32))
            }

            shift += 7

            if (!(b & 0x80)) {
                break
            }

            if (rsize >= 10) {
                throw new TProtocolException(TProtocolExceptionType.INVALID_DATA, `Variable-length int over 10 bytes.`)
            }
        }

        return new Int64(hi, lo)
    }

    private writeFieldBeginInternal(name: string, fieldType: TType, fieldId: number, typeOverride: number): void {
        // If there's a type override, use that.
        const typeToWrite = (typeOverride === -1 ? this.getCompactType(fieldType) : typeOverride)

        // Check if we can delta encode the field id
        if (fieldId > this._lastFieldId && fieldId - this._lastFieldId <= 15) {
            // Include the type delta with the field ID
            this.writeByte((fieldId - this._lastFieldId) << 4 | typeToWrite)
        } else {
            // Write separate type and ID values
            this.writeByte(typeToWrite)
            this.writeI16(fieldId)
        }
        this._lastFieldId = fieldId
    }

    private writeCollectionBegin(elementType: TType, size: number): void {
        if (size <= 14) {
            // Combine size and type in one byte if possible
            this.writeByte(size << 4 | this.getCompactType(elementType))

        } else {
            this.writeByte(0xf0 | this.getCompactType(elementType))
            this.writeVarint32(size)
        }
    }

    /**
     * Write an i32 as a varint. Results in 1-5 bytes on the wire.
     */
    private writeVarint32(i32: number): void {
        const buf: Buffer = Buffer.alloc(5)
        let wsize: number = 0
        while (true) {
            if ((i32 & ~0x7F) === 0) {
                buf[wsize++] = i32
                break

            } else {
                buf[wsize++] = ((i32 & 0x7F) | 0x80)
                i32 = i32 >>> 7
            }
        }

        const wbuf: Buffer = Buffer.alloc(wsize)
        buf.copy(wbuf, 0, 0, wsize)
        this.transport.write(wbuf)
    }

    /**
     * Write an i64 as a varint. Results in 1-10 bytes on the wire.
     * N.B. node-int64 is always big endian
     */
    private writeVarint64(i64: number | Int64): void {
        if (typeof i64 === 'number') {
            i64 = new Int64(i64)
        }

        if (!(i64 instanceof Int64)) {
            throw new TProtocolException(TProtocolExceptionType.INVALID_DATA, `Expected Int64 or Number, found: ${i64}`)
        } else {
            const buf: Buffer = new Buffer(10)
            let wsize: number = 0
            let hi: number = i64.buffer.readUInt32BE(0, true)
            let lo: number = i64.buffer.readUInt32BE(4, true)
            let mask: number = 0

            while (true) {
                if (((lo & ~0x7F) === 0) && (hi === 0)) {
                    buf[wsize++] = lo
                    break

                } else {
                    buf[wsize++] = ((lo & 0x7F) | 0x80)
                    mask = hi << 25
                    lo = lo >>> 7
                    hi = hi >>> 7
                    lo = lo | mask
                }
            }

            const wbuf = Buffer.alloc(wsize)
            buf.copy(wbuf, 0, 0, wsize)
            this.transport.write(wbuf)
        }
    }

    /**
     * Convert l into a zigzag long. This allows negative numbers to be
     * represented compactly as a varint.
     */
    private i64ToZigzag(i64: number | Int64): Int64 {
        if (typeof i64 === 'string') {
            i64 = new Int64(parseInt(i64, 10))

        } else if (typeof i64 === 'number') {
            i64 = new Int64(i64)
        }

        if (!(i64 instanceof Int64)) {
            throw new TProtocolException(TProtocolExceptionType.INVALID_DATA, `Expected Int64 or Number, found: ${i64}`)
        } else {
            let hi: number = i64.buffer.readUInt32BE(0, true)
            let lo: number = i64.buffer.readUInt32BE(4, true)
            const sign: number = hi >>> 31

            hi = ((hi << 1) | (lo >>> 31)) ^ ((!!sign) ? 0xFFFFFFFF : 0)
            lo = (lo << 1) ^ ((!!sign) ? 0xFFFFFFFF : 0)

            return new Int64(hi, lo)
        }
    }

    /**
     * Convert n into a zigzag int. This allows negative numbers to be
     * represented compactly as a varint.
     */
    private i32ToZigzag(i32: number): number {
        return (i32 << 1) ^ ((i32 & 0x80000000) ? 0xFFFFFFFF : 0)
    }
}
