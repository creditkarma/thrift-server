/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/js/src/thrift.js
 */
import { TProtocolException, TProtocolExceptionType } from '../errors'

import { TTransport } from '../transports'

import {
    IInt64,
    Int64,
    isInt64,
    IThriftField,
    IThriftList,
    IThriftMap,
    IThriftMessage,
    IThriftSet,
    IThriftStruct,
    MessageType,
    TType,
} from '../types'

import { parseJson } from '../parseJson'
import { I64Type, TProtocol } from './TProtocol'

export class JSONProtocol extends TProtocol {
    private static readonly version = 1

    private static readonly rType: { [K: string]: TType } = {
        tf: TType.BOOL,
        i8: TType.BYTE,
        i16: TType.I16,
        i32: TType.I32,
        i64: TType.I64,
        dbl: TType.DOUBLE,
        rec: TType.STRUCT,
        str: TType.STRING,
        map: TType.MAP,
        lst: TType.LIST,
        set: TType.SET,
    }
    private tstack: Array<any> = []
    private tpos: Array<number> = []

    private rstack: Array<any> = []
    private rpos: Array<number> = []

    constructor(trans: TTransport) {
        super(trans)
        this.tstack = []
        this.tpos = []
    }

    public writeMessageBegin(name: string, type: MessageType, id: number) {
        this.tstack = []
        this.tpos = []

        this.tstack.push([JSONProtocol.version, `"${name}"`, type, id])
    }

    public writeMessageEnd() {
        const obj = this.tstack.pop()

        const wobj = this.tstack.pop()
        wobj.push(obj)

        const wbuf = `[${wobj.join(',')}]`

        this.transport.write(Buffer.from(wbuf))
    }

    public writeStructBegin(name: string) {
        this.tpos.push(this.tstack.length)
        this.tstack.push({})
    }

    public writeStructEnd() {
        const p = this.tpos.pop()
        if (p === undefined) {
            return
        }

        const struct = this.tstack[p]
        let str = '{'
        let first = true
        for (const key of Object.keys(struct)) {
            if (first) {
                first = false
            } else {
                str += ','
            }

            str += `${key}:${struct[key]}`
        }

        str += '}'
        this.tstack[p] = str
    }

    public writeFieldBegin(name: string, type: TType, id: number) {
        this.tpos.push(this.tstack.length)
        this.tstack.push({
            fieldId: `"${id}"`,
            fieldType: this.getTypeName(type),
        })
    }

    public writeFieldEnd() {
        const value = this.tstack.pop()
        const fieldInfo = this.tstack.pop()

        this.tstack[this.tstack.length - 1][
            fieldInfo.fieldId
        ] = `{${fieldInfo.fieldType}:${value}}`
        this.tpos.pop()
    }

    public writeFieldStop() {}

    public writeMapBegin(keyType: TType, valType: TType, size: number) {
        this.tpos.push(this.tstack.length)
        this.tstack.push([
            this.getTypeName(keyType),
            this.getTypeName(valType),
            0,
        ])
    }

    public writeMapEnd() {
        const p = this.tpos.pop()
        if (p === undefined) {
            return
        }

        if (p === this.tstack.length) {
            return
        }

        if ((this.tstack.length - p - 1) % 2 !== 0) {
            this.tstack.push('')
        }

        const size = (this.tstack.length - p - 1) / 2

        this.tstack[p][this.tstack[p].length - 1] = size

        let map = '}'
        let first = true
        while (this.tstack.length > p + 1) {
            const v = this.tstack.pop()
            let k = this.tstack.pop()
            if (first) {
                first = false
            } else {
                map = `,${map}`
            }

            if (!isNaN(k)) {
                k = `"${k}"`
            } // json "keys" need to be strings
            map = `${k}:${v}${map}`
        }
        map = `{${map}`

        this.tstack[p].push(map)
        this.tstack[p] = `[${this.tstack[p].join(',')}]`
    }

    public writeListBegin(elemType: TType, size: number) {
        this.tpos.push(this.tstack.length)
        this.tstack.push([this.getTypeName(elemType), size])
    }

    public writeListEnd() {
        const p = this.tpos.pop()
        if (p === undefined) {
            return
        }

        while (this.tstack.length > p + 1) {
            const tmpVal = this.tstack[p + 1]
            this.tstack.splice(p + 1, 1)
            this.tstack[p].push(tmpVal)
        }

        this.tstack[p] = `[${this.tstack[p].join(',')}]`
    }

    public writeSetBegin(elemType: TType, size: number) {
        this.tpos.push(this.tstack.length)
        this.tstack.push([this.getTypeName(elemType), size])
    }

    public writeSetEnd() {
        const p = this.tpos.pop()
        if (p === undefined) {
            return
        }

        while (this.tstack.length > p + 1) {
            const tmpVal = this.tstack[p + 1]
            this.tstack.splice(p + 1, 1)
            this.tstack[p].push(tmpVal)
        }

        this.tstack[p] = `[${this.tstack[p].join(',')}]`
    }

    public writeBool(value: boolean) {
        this.tstack.push(value ? 1 : 0)
    }

    public writeByte(i8: number) {
        this.tstack.push(i8)
    }

    public writeI16(i16: number) {
        this.tstack.push(i16)
    }

    public writeI32(i32: number) {
        this.tstack.push(i32)
    }

    public writeI64(i64: number | string | bigint | IInt64) {
        if (typeof i64 === 'number') {
            this.tstack.push(i64)
        } else if (typeof i64 === 'string') {
            // Do not pass through non-numeric strings.
            this.tstack.push(Int64.fromDecimalString(i64).toDecimalString())
        } else if (typeof i64 === 'bigint') {
            Int64.assert64BitRange(i64)
            this.tstack.push(i64.toString())
        } else if (isInt64(i64)) {
            this.tstack.push(i64.toDecimalString())
        } else {
            throw new TypeError(
                `Expected Int64, BigInt, number, or decimal string but found type ${typeof i64}`,
            )
        }
    }

    public writeDouble(dbl: number) {
        this.tstack.push(dbl)
    }

    public writeString(str: string | null) {
        // We do not encode uri components for wire transfer:
        if (str === null) {
            this.tstack.push(null)
        } else {
            // concat may be slower than building a byte buffer
            let escapedString = ''
            for (let i = 0; i < str.length; i++) {
                const ch = str.charAt(i) // a single double quote: "
                if (ch === '"') {
                    escapedString += '\\"' // write out as: \"
                } else if (ch === '\\') {
                    // a single backslash
                    escapedString += '\\\\' // write out as double backslash
                } else if (ch === '\b') {
                    // a single backspace: invisible
                    escapedString += '\\b' // write out as: \b"
                } else if (ch === '\f') {
                    // a single formfeed: invisible
                    escapedString += '\\f' // write out as: \f"
                } else if (ch === '\n') {
                    // a single newline: invisible
                    escapedString += '\\n' // write out as: \n"
                } else if (ch === '\r') {
                    // a single return: invisible
                    escapedString += '\\r' // write out as: \r"
                } else if (ch === '\t') {
                    // a single tab: invisible
                    escapedString += '\\t' // write out as: \t"
                } else {
                    escapedString += ch // Else it need not be escaped
                }
            }
            this.tstack.push(`"${escapedString}"`)
        }
    }

    public writeBinary(binary: string | Buffer) {
        let str = ''
        if (typeof binary === 'string') {
            str = binary
        } else if (binary instanceof Buffer) {
            const arr = binary
            for (const i of arr) {
                str += String.fromCharCode(arr[i])
            }
        } else {
            throw new TypeError('writeBinary only accepts String or Buffer.')
        }
        this.tstack.push(`"${Buffer.from(str).toString('base64')}"`)
    }

    public readMessageBegin(): IThriftMessage {
        this.rstack = []
        this.rpos = []

        const robj = parseJson(this.transport.readAll())

        const version = robj.shift()

        if (version !== JSONProtocol.version) {
            throw new Error(`Wrong thrift protocol version: ${version}`)
        }

        const r: IThriftMessage = {
            fieldName: robj.shift(),
            messageType: robj.shift(),
            requestId: robj.shift(),
        }

        // get to the main obj
        this.rstack.push(robj.shift())

        return r
    }

    public readMessageEnd() {}

    public readStructBegin() {
        const r: IThriftStruct = {
            fieldName: '',
        }

        // incase this is an array of structs
        if (this.rstack[this.rstack.length - 1] instanceof Array) {
            this.rstack.push(this.rstack[this.rstack.length - 1].shift())
        }

        return r
    }

    public readStructEnd() {
        if (this.rstack[this.rstack.length - 2] instanceof Array) {
            this.rstack.pop()
        }
    }

    public readFieldBegin(): IThriftField {
        let fid = -1
        let ftype = TType.STOP

        // get a fieldId
        for (const f in this.rstack[this.rstack.length - 1]) {
            if (f === null) {
                continue
            }

            fid = parseInt(f, 10)
            this.rpos.push(this.rstack.length)

            const field = this.rstack[this.rstack.length - 1][fid]

            // remove so we don't see it again
            delete this.rstack[this.rstack.length - 1][fid]

            this.rstack.push(field)

            break
        }

        if (fid !== -1) {
            // should only be 1 of these but this is the only
            // way to match a key
            for (const i in this.rstack[this.rstack.length - 1]) {
                if (JSONProtocol.rType[i] === null) {
                    continue
                }

                ftype = JSONProtocol.rType[i]
                this.rstack[this.rstack.length - 1] = this.rstack[
                    this.rstack.length - 1
                ][i]
            }
        }

        return {
            fieldId: fid,
            fieldName: '',
            fieldType: ftype,
        }
    }

    public readFieldEnd() {
        const pos = this.rpos.pop()
        if (pos === undefined) {
            return
        }

        // get back to the right place in the stack
        while (this.rstack.length > pos) {
            this.rstack.pop()
        }
    }

    public readMapBegin(): IThriftMap {
        let map = this.rstack.pop()
        let first = map.shift()
        if (first instanceof Array) {
            this.rstack.push(map)
            map = first
            first = map.shift()
        }

        const r: IThriftMap = {
            keyType: JSONProtocol.rType[first],
            valueType: JSONProtocol.rType[map.shift()],
            size: map.shift(),
        }

        this.rpos.push(this.rstack.length)
        this.rstack.push(map.shift())

        return r
    }

    public readMapEnd() {
        this.readFieldEnd()
    }

    public readListBegin(): IThriftList {
        const list = this.rstack[this.rstack.length - 1]

        const r: IThriftList = {
            elementType: JSONProtocol.rType[list.shift()],
            size: list.shift(),
        }

        this.rpos.push(this.rstack.length)
        this.rstack.push(list.shift())

        return r
    }

    public readListEnd() {
        let pos = this.rpos.pop()
        if (pos === undefined) {
            return
        }
        pos = pos - 2
        const st = this.rstack
        st.pop()
        if (st instanceof Array && st.length > pos && st[pos].length > 0) {
            st.push(st[pos].shift())
        }
    }

    public readSetBegin(): IThriftSet {
        return this.readListBegin()
    }

    public readSetEnd() {
        return this.readListEnd()
    }

    public readBool(): boolean {
        const r = this.readValue()
        if (r === null) {
            return false
        } else if (r === '1' || r === 1) {
            return true
        } else {
            return false
        }
    }

    public readByte() {
        return this.readI32()
    }

    public readI16(): number {
        return this.readI32()
    }

    public readI32(): number {
        return parseInt(this.readValue(), 10)
    }

    public readI64(type?: 'int64'): Int64
    public readI64(type: 'bigint'): bigint
    public readI64(type: I64Type = 'int64'): bigint | Int64 {
        if (type === 'bigint') {
            return BigInt(`${this.readValue()}`)
        } else {
            return Int64.fromDecimalString(`${this.readValue()}`)
        }
    }

    public readDouble() {
        return parseFloat(this.readValue())
    }

    public readBinary() {
        return Buffer.alloc(this.readValue(), 'base64')
    }

    public readString() {
        return this.readValue()
    }

    public skip(type: TType) {
        switch (type) {
            case TType.STOP:
                return null

            case TType.BOOL:
                return this.readBool()

            case TType.BYTE:
                return this.readByte()

            case TType.I16:
                return this.readI16()

            case TType.I32:
                return this.readI32()

            case TType.I64:
                return this.readI64()

            case TType.DOUBLE:
                return this.readDouble()

            case TType.STRING:
                return this.readString()

            case TType.STRUCT:
                this.readStructBegin()
                while (true) {
                    const struct = this.readFieldBegin()
                    if (struct.fieldType === TType.STOP) {
                        break
                    }
                    this.skip(struct.fieldType)
                    this.readFieldEnd()
                }
                this.readStructEnd()
                return null

            case TType.MAP:
                const map = this.readMapBegin()
                for (let i = 0; i < map.size; i++) {
                    if (i > 0) {
                        if (
                            this.rstack.length >
                            this.rpos[this.rpos.length - 1] + 1
                        ) {
                            this.rstack.pop()
                        }
                    }
                    this.skip(map.keyType)
                    this.skip(map.keyType)
                }
                this.readMapEnd()
                return null

            case TType.SET:
                const set = this.readSetBegin()
                for (let i = 0; i < set.size; i++) {
                    this.skip(set.elementType)
                }
                this.readSetEnd()
                return null

            case TType.LIST:
                const list = this.readListBegin()
                for (let i = 0; i < list.size; i++) {
                    this.skip(list.elementType)
                }
                this.readListEnd()
                return null

            default:
                throw new TProtocolException(
                    TProtocolExceptionType.INVALID_DATA,
                )
        }
    }

    private readValue() {
        const f = this.rstack[this.rstack.length - 1]

        if (f instanceof Array) {
            if (f.length === 0) {
                return undefined
            } else {
                return f.shift()
            }
        } else if (f instanceof Object) {
            for (const i in f) {
                if (i === null) {
                    continue
                }
                this.rstack.push(f[i])
                delete f[i]

                return i
                break
            }
        } else {
            this.rstack.pop()
            return f
        }
    }

    private getTypeName(type: TType) {
        switch (type) {
            case TType.BOOL:
                return '"tf"'
            case TType.BYTE:
                return '"i8"'
            case TType.I16:
                return '"i16"'
            case TType.I32:
                return '"i32"'
            case TType.I64:
                return '"i64"'
            case TType.DOUBLE:
                return '"dbl"'
            case TType.STRUCT:
                return '"rec"'
            case TType.STRING:
                return '"str"'
            case TType.MAP:
                return '"map"'
            case TType.LIST:
                return '"lst"'
            case TType.SET:
                return '"set"'
            default:
                throw new TProtocolException(
                    TProtocolExceptionType.NOT_IMPLEMENTED,
                    `Unrecognized type ${type}`,
                )
        }
    }
}
