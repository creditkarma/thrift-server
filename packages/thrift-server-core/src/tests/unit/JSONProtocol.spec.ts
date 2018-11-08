import { expect } from 'code'
import * as Lab from 'lab'

import {
    BufferedTransport,
    Int64,
    JSONProtocol,
    MessageType,
    TType,
} from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('JSONProtocol', () => {
    describe('calls', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getMessage', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)

            protocol.writeStructBegin('request')
            protocol.writeStructEnd()

            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getMessage",1,1,{"1":{"rec":{}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(`[1,"getMessage",1,1,{"1":{"rec":{}}}]`)
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            expect(protocol.readMessageBegin()).to.equal({
                fieldName: 'getMessage',
                messageType: MessageType.CALL,
                requestId: 1,
            })

            protocol.readStructBegin()
            protocol.readStructEnd()

            expect(protocol.readMessageEnd()).to.be.undefined()
        })
    })

    describe('bools', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getBool', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('t', TType.BOOL, 1)
            protocol.writeBool(true)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('f', TType.BOOL, 2)
            protocol.writeBool(false)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getBool",1,1,{"1":{"rec":{"1":{"tf":1},"2":{"tf":0}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getBool",1,1,{"1":{"rec":{"1":{"tf":1},"2":{"tf":0}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readBool()).to.equal(true)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readBool()).to.equal(false)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('bytes', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getByte', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.BYTE, 1)
            protocol.writeByte(-128)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.BYTE, 2)
            protocol.writeByte(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.BYTE, 3)
            protocol.writeByte(127)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getByte",1,1,{"1":{"rec":{"1":{"i8":-128},"2":{"i8":0},"3":{"i8":127}}}}]`,
            )
        })
        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getByte",1,1,{"1":{"rec":{"1":{"i8":-128},"2":{"i8":0},"3":{"i8":127}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readByte()).to.equal(-128)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readByte()).to.equal(0)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readByte()).to.equal(127)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('i16s', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getI16', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.I16, 1)
            protocol.writeI16(-32768)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.I16, 2)
            protocol.writeI16(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.I16, 3)
            protocol.writeI16(32767)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getI16",1,1,{"1":{"rec":{"1":{"i16":-32768},"2":{"i16":0},"3":{"i16":32767}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getI16",1,1,{"1":{"rec":{"1":{"i16":-32768},"2":{"i16":0},"3":{"i16":32767}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readI16()).to.equal(-32768)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI16()).to.equal(0)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI16()).to.equal(32767)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('i32s', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getI32', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.I32, 1)
            protocol.writeI32(-2147483648)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.I32, 2)
            protocol.writeI32(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.I32, 3)
            protocol.writeI32(2147483647)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getI32",1,1,{"1":{"rec":{"1":{"i32":-2147483648},"2":{"i32":0},"3":{"i32":2147483647}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getI32",1,1,{"1":{"rec":{"1":{"i32":-2147483648},"2":{"i32":0},"3":{"i32":2147483647}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readI32()).to.equal(-2147483648)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI32()).to.equal(0)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI32()).to.equal(2147483647)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('i64s', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getI64', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.I64, 1)
            protocol.writeI64(Int64.fromDecimalString('-9223372036854775808'))
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.I64, 2)
            protocol.writeI64(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.I64, 3)
            protocol.writeI64(Int64.fromDecimalString('9223372036854775807'))
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getI64",1,1,{"1":{"rec":{"1":{"i64":-9223372036854775808},"2":{"i64":0},"3":{"i64":9223372036854775807}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getI64",1,1,{"1":{"rec":{"1":{"i64":-9223372036854775808},"2":{"i64":0},"3":{"i64":9223372036854775807}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readI64()).to.equal(
                Int64.fromDecimalString('-9223372036854775808'),
            )
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI64()).to.equal(Int64.fromDecimalString('0'))
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI64()).to.equal(
                Int64.fromDecimalString('9223372036854775807'),
            )
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('doubles', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getDouble', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.DOUBLE, 1)
            protocol.writeDouble(4.94e-322)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.DOUBLE, 2)
            protocol.writeDouble(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.DOUBLE, 3)
            protocol.writeDouble(1.7976931348623157e308)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getDouble",1,1,{"1":{"rec":{"1":{"dbl":4.94e-322},"2":{"dbl":0},"3":{"dbl":1.7976931348623157e+308}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getDouble",1,1,{"1":{"rec":{"1":{"dbl":4.94e-322},"2":{"dbl":0},"3":{"dbl":1.7976931348623157e+308}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readDouble()).to.equal(4.94e-322)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readDouble()).to.equal(0)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readDouble()).to.equal(1.7976931348623157e308)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('strings', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getString', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('empty', TType.STRING, 1)
            protocol.writeString('')
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('foo', TType.STRING, 2)
            protocol.writeString('foo')
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('bar', TType.STRING, 3)
            protocol.writeString('bar')
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getString",1,1,{"1":{"rec":{"1":{"str":""},"2":{"str":"foo"},"3":{"str":"bar"}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getString",1,1,{"1":{"rec":{"1":{"str":""},"2":{"str":"foo"},"3":{"str":"bar"}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readString()).to.equal('')
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readString()).to.equal('foo')
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readString()).to.equal('bar')
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('lists', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getList', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('empty', TType.LIST, 1)
            protocol.writeListBegin(TType.BOOL, 2)
            protocol.writeBool(true)
            protocol.writeBool(false)
            protocol.writeListEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('foo', TType.LIST, 2)
            protocol.writeListBegin(TType.I32, 3)
            protocol.writeI32(-128)
            protocol.writeI32(0)
            protocol.writeI32(127)
            protocol.writeListEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('bar', TType.LIST, 3)
            protocol.writeListBegin(TType.STRING, 3)
            protocol.writeString('')
            protocol.writeString('foo')
            protocol.writeString('bar')
            protocol.writeListEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getList",1,1,{"1":{"rec":{"1":{"lst":["tf",2,1,0]},"2":{"lst":["i32",3,-128,0,127]},"3":{"lst":["str",3,"","foo","bar"]}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getList",1,1,{"1":{"rec":{"1":{"lst":["tf",2,1,0]},"2":{"lst":["i32",3,-128,0,127]},"3":{"lst":["str",3,"","foo","bar"]}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readListBegin()).to.equal({
                elementType: TType.BOOL,
                size: 2,
            })
            expect(protocol.readBool()).to.equal(true)
            expect(protocol.readBool()).to.equal(false)
            expect(protocol.readListEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readListBegin()).to.equal({
                elementType: TType.I32,
                size: 3,
            })
            expect(protocol.readI32()).to.equal(-128)
            expect(protocol.readI32()).to.equal(0)
            expect(protocol.readI32()).to.equal(127)
            expect(protocol.readListEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readListBegin()).to.equal({
                elementType: TType.STRING,
                size: 3,
            })
            expect(protocol.readString()).to.equal('')
            expect(protocol.readString()).to.equal('foo')
            expect(protocol.readString()).to.equal('bar')
            expect(protocol.readListEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('sets', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getSet', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('empty', TType.SET, 1)
            protocol.writeSetBegin(TType.BOOL, 2)
            protocol.writeBool(true)
            protocol.writeBool(false)
            protocol.writeSetEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('foo', TType.SET, 2)
            protocol.writeSetBegin(TType.I32, 3)
            protocol.writeI32(-128)
            protocol.writeI32(0)
            protocol.writeI32(127)
            protocol.writeSetEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('bar', TType.SET, 3)
            protocol.writeSetBegin(TType.STRING, 3)
            protocol.writeString('')
            protocol.writeString('foo')
            protocol.writeString('bar')
            protocol.writeSetEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getSet",1,1,{"1":{"rec":{"1":{"set":["tf",2,1,0]},"2":{"set":["i32",3,-128,0,127]},"3":{"set":["str",3,"","foo","bar"]}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getSet",1,1,{"1":{"rec":{"1":{"set":["tf",2,1,0]},"2":{"set":["i32",3,-128,0,127]},"3":{"set":["str",3,"","foo","bar"]}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readSetBegin()).to.equal({
                elementType: TType.BOOL,
                size: 2,
            })
            expect(protocol.readBool()).to.equal(true)
            expect(protocol.readBool()).to.equal(false)
            expect(protocol.readSetEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readSetBegin()).to.equal({
                elementType: TType.I32,
                size: 3,
            })
            expect(protocol.readI32()).to.equal(-128)
            expect(protocol.readI32()).to.equal(0)
            expect(protocol.readI32()).to.equal(127)
            expect(protocol.readSetEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readSetBegin()).to.equal({
                elementType: TType.STRING,
                size: 3,
            })
            expect(protocol.readString()).to.equal('')
            expect(protocol.readString()).to.equal('foo')
            expect(protocol.readString()).to.equal('bar')
            expect(protocol.readSetEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })

    describe('maps', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new JSONProtocol(transport)

            protocol.writeMessageBegin('getMap', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('string-i32', TType.MAP, 1)
            protocol.writeMapBegin(TType.STRING, TType.I32, 3)
            protocol.writeString('lower')
            protocol.writeI32(-128)
            protocol.writeString('mid')
            protocol.writeI32(0)
            protocol.writeString('upper')
            protocol.writeI32(127)
            protocol.writeMapEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('i32-bool', TType.MAP, 2)
            protocol.writeMapBegin(TType.I32, TType.BOOL, 2)
            protocol.writeI32(0)
            protocol.writeBool(false)
            protocol.writeI32(1)
            protocol.writeBool(true)
            protocol.writeMapEnd()
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString()).to.equal(
                `[1,"getMap",1,1,{"1":{"rec":{"1":{"map":["str","i32",3,{"lower":-128,"mid":0,"upper":127}]},"2":{"map":["i32","tf",2,{"0":0,"1":1}]}}}}]`,
            )
        })

        it('should deserialize', () => {
            const buffer = new Buffer(
                `[1,"getMap",1,1,{"1":{"rec":{"1":{"map":["str","i32",3,{"lower":-128,"mid":0,"upper":127}]},"2":{"map":["i32","tf",2,{"0":0,"1":1}]}}}}]`,
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new JSONProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readMapBegin()).to.equal({
                keyType: TType.STRING,
                valueType: TType.I32,
                size: 3,
            })
            expect(protocol.readString()).to.equal('lower')
            expect(protocol.readI32()).to.equal(-128)
            expect(protocol.readString()).to.equal('mid')
            expect(protocol.readI32()).to.equal(0)
            expect(protocol.readString()).to.equal('upper')
            expect(protocol.readI32()).to.equal(127)
            expect(protocol.readMapEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readMapBegin()).to.equal({
                keyType: TType.I32,
                valueType: TType.BOOL,
                size: 2,
            })
            expect(protocol.readI32()).to.equal(0)
            expect(protocol.readBool()).to.equal(false)
            expect(protocol.readI32()).to.equal(1)
            expect(protocol.readBool()).to.equal(true)
            expect(protocol.readMapEnd()).to.be.undefined()
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })
    })
})
