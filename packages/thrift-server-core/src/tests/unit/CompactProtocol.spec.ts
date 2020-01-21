import { expect, fail } from '@hapi/code'
import * as Lab from '@hapi/lab'

import {
    BufferedTransport,
    CompactProtocol,
    Int64,
    MessageType,
    TProtocolException,
    TType,
} from '../../main'
import { Int56, Int72, LikeInt64, NoBufferInt64, NoStringInt64 } from './types'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('CompactProtocol', () => {
    describe('calls', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

            protocol.writeMessageBegin('getMessage', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)

            protocol.writeStructBegin('request')
            protocol.writeStructEnd()

            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString('hex')).to.equal(
                '8221010a6765744d6573736167651c00',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '8221010a6765744d6573736167651c00',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '82210107676574426f6f6c1c11120000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '82210107676574426f6f6c1c11120000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '82210107676574427974651c13801300137f0000',
            )
        })
        it('should deserialize', () => {
            const buffer = Buffer.from(
                '82210107676574427974651c13801300137f0000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '822101066765744931361c14ffff03140014feff030000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '822101066765744931361c14ffff03140014feff030000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '822101066765744933321c15ffffffff0f150015feffffff0f0000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '822101066765744933321c15ffffffff0f150015feffffff0f0000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
        // Intentional loss of types for testing.
        const serialize = (lower: any, upper: any): string => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

            protocol.writeMessageBegin('getI64', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('lower', TType.I64, 1)
            protocol.writeI64(lower)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('mid', TType.I64, 2)
            protocol.writeI64(0)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('upper', TType.I64, 3)
            protocol.writeI64(upper)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            return transport.flush().toString('hex')
        }

        // Deserialize and check for the expected values.
        const deserialize = (
            data: string,
            lower: string,
            upper: string,
        ): void => {
            const buffer = Buffer.from(data, 'hex')
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readI64().toDecimalString()).to.equal(lower)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI64().toDecimalString()).to.equal('0')
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readI64().toDecimalString()).to.equal(upper)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        }

        it('should serialize', () => {
            const lower = Int64.fromDecimalString('-9223372036854775808')
            const upper = Int64.fromDecimalString('9223372036854775807')

            expect(serialize(lower, upper)).to.equal(
                '822101066765744936341c16ffffffffffffffffff01160016feffffffffffffffff010000',
            )
        })

        it('should deserialize', () => {
            deserialize(
                '822101066765744936341c16ffffffffffffffffff01160016feffffffffffffffff010000',
                '-9223372036854775808',
                '9223372036854775807',
            )
        })

        it('should handle Int64 with offset', () => {
            // Use one buffer but two different offsets.
            // Also checks that only the expected 8 bytes are used.
            const buffer = Buffer.alloc(10)
            buffer.writeUInt8(1, 0)
            buffer.writeUInt8(2, 9)
            const lower = new Int64(buffer, 2)
            const upper = new Int64(buffer, 0)

            const expected =
                '822101066765744936341c16041600168080808080808080020000'
            expect(serialize(lower, upper)).to.equal(expected)
            deserialize(expected, '2', '72057594037927936')
        })

        it('should pad short Int64', () => {
            // Fewer than 8 bytes. Offset greater than the length.
            const buffer = Buffer.alloc(6)
            buffer.writeUInt8(1, 0)
            const lower = new Int64(buffer, 10)
            const upper = new Int64(buffer)

            const expected = '822101066765744936341c16001600168080808080400000'
            expect(serialize(lower, upper)).to.equal(expected)
            deserialize(expected, '0', '1099511627776')
        })

        it('should serialize string', () => {
            const lower = '-9223372036854775808'
            const upper = '9223372036854775807'

            expect(serialize(lower, upper)).to.equal(
                '822101066765744936341c16ffffffffffffffffff01160016feffffffffffffffff010000',
            )
        })

        it('should serialize number', () => {
            const lower = -123
            const upper = 123

            const expected = '822101066765744936341c16f501160016f6010000'
            expect(serialize(lower, upper)).to.equal(expected)
            deserialize(expected, '-123', '123')
        })

        it('should serialize Int64-like object', () => {
            const lower = new LikeInt64('-9223372036854775808')
            const upper = new LikeInt64('9223372036854775807')

            expect(serialize(lower, upper)).to.equal(
                '822101066765744936341c16ffffffffffffffffff01160016feffffffffffffffff010000',
            )
        })

        it('should error if no buffer', () => {
            const lower = new NoBufferInt64('-9223372036854775808')
            const upper = new NoBufferInt64('9223372036854775807')

            try {
                serialize(lower, upper)
            } catch (e) {
                expect(e).to.be.an.instanceOf(TProtocolException)
                return
            }
            fail('Error expected')
        })

        it('should error if buffer length < 8', () => {
            const lower = new Int56('-9223372036854775808')
            const upper = new Int56('9223372036854775807')

            try {
                serialize(lower, upper)
            } catch (e) {
                expect(e).to.be.an.instanceOf(TProtocolException)
                return
            }
            fail('Error expected')
        })

        it('should error if buffer length > 8', () => {
            const lower = new Int72('-9223372036854775808')
            const upper = new Int72('9223372036854775807')

            try {
                serialize(lower, upper)
            } catch (e) {
                expect(e).to.be.an.instanceOf(TProtocolException)
                return
            }
            fail('Error expected')
        })

        it('should error if no toDecimalString()', () => {
            const lower = new NoStringInt64('-9223372036854775808')
            const upper = new NoStringInt64('9223372036854775807')

            try {
                serialize(lower, upper)
            } catch (e) {
                expect(e).to.be.an.instanceOf(TProtocolException)
                return
            }
            fail('Error expected')
        })
    })

    // The compact protocol supports +/- Infinity and NaN.
    describe('doubles', () => {
        it('should serialize', () => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '82210109676574446f75626c651c17640000000000000017000000000000000017ffffffffffffef7f0000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '82210109676574446f75626c651c17640000000000000017000000000000000017ffffffffffffef7f0000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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

        it('should serialize Infinity', () => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

            protocol.writeMessageBegin('getDouble', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('negative', TType.DOUBLE, 1)
            protocol.writeDouble(-Infinity)
            protocol.writeFieldEnd()

            protocol.writeFieldBegin('positive', TType.DOUBLE, 2)
            protocol.writeDouble(Infinity)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString('hex')).to.equal(
                '82210109676574446f75626c651c17000000000000f0ff17000000000000f07f0000',
            )
        })

        it('should deserialize Infinity', () => {
            const buffer = Buffer.from(
                '82210109676574446f75626c651c17000000000000f0ff17000000000000f07f0000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(protocol.readDouble()).to.equal(-Infinity)
            protocol.readFieldEnd()

            protocol.readFieldBegin()
            expect(protocol.readDouble()).to.equal(Infinity)
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })

        it('should serialize NaN', () => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

            protocol.writeMessageBegin('getDouble', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('NaN', TType.DOUBLE, 1)
            protocol.writeDouble(NaN)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString('hex')).to.equal(
                '82210109676574446f75626c651c17000000000000f87f0000',
            )
        })

        it('should deserialize NaN', () => {
            const buffer = Buffer.from(
                '82210109676574446f75626c651c17000000000000f87f0000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            expect(Number.isNaN(protocol.readDouble())).to.be.true()
            protocol.readFieldEnd()

            protocol.readStructEnd()
            protocol.readFieldEnd()
            protocol.readStructEnd()
            protocol.readMessageEnd()
        })

        it('should serialize -0', () => {
            const transport = new BufferedTransport()
            const protocol = new CompactProtocol(transport)

            protocol.writeMessageBegin('getDouble', MessageType.CALL, 1)
            protocol.writeStructBegin('args')
            protocol.writeFieldBegin('rec', TType.STRUCT, 1)
            protocol.writeStructBegin('request')

            protocol.writeFieldBegin('zero', TType.DOUBLE, 2)
            protocol.writeDouble(-0)
            protocol.writeFieldEnd()

            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeFieldEnd()
            protocol.writeFieldStop()
            protocol.writeStructEnd()
            protocol.writeMessageEnd()

            expect(transport.flush().toString('hex')).to.equal(
                '82210109676574446f75626c651c2700000000000000800000',
            )
        })

        it('should deserialize -0', () => {
            const buffer = Buffer.from(
                '82210109676574446f75626c651c2700000000000000800000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

            protocol.readMessageBegin()
            protocol.readStructBegin()
            protocol.readFieldBegin()
            protocol.readStructBegin()

            protocol.readFieldBegin()
            const zero = protocol.readDouble()
            // hapi/code appears to differentiate between 0 and -0 when checking equals.
            expect(zero).to.equal(-0)
            // Standard check for 0 vs. -0 just in case.
            expect(1 / zero).to.equal(-Infinity)
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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '82210109676574537472696e671c18001803666f6f18036261720000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '82210109676574537472696e671c18001803666f6f18036261720000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '822101076765744c6973741c192101021935ff0100fe0119380003666f6f036261720000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '822101076765744c6973741c192101021935ff0100fe0119380003666f6f036261720000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '822101066765745365741c1a2101021a35ff0100fe011a380003666f6f036261720000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '822101066765745365741c1a2101021a35ff0100fe011a380003666f6f036261720000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
            const protocol = new CompactProtocol(transport)

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

            expect(transport.flush().toString('hex')).to.equal(
                '822101066765744d61701c1b0385056c6f776572ff01036d696400057570706572fe011b0251000202010000',
            )
        })

        it('should deserialize', () => {
            const buffer = Buffer.from(
                '822101066765744d61701c1b0385056c6f776572ff01036d696400057570706572fe011b0251000202010000',
                'hex',
            )
            const transport = new BufferedTransport(buffer)
            const protocol = new CompactProtocol(transport)

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
