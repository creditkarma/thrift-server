import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'

import { IInt64, Int64, isInt64 } from '../../main'
import { Int56, Int72, LikeInt64, NoBufferInt64, NoStringInt64 } from './types'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Int64', () => {
    const TEST_STRING: string = '9837756439'
    const TOO_LARGE: string = '999999999999999999999999999999'
    const TEST_BUFFER = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    it('should handle positive values around the 31st bit (signed vs. unsigned low bytes)', async () => {
        const i64 = new Int64(0)
        const limit = Math.pow(2, 31)
        for (let i = limit - 5; i >= limit + 5; ++i) {
            i64.setValue(i)
            expect(i64.valueOf()).to.equal(i)
            expect(i64.toDecimalString()).to.equal(i.toString())
        }
    })

    it('should handle positive values around the 32nd bit (high vs. low bytes)', async () => {
        const i64 = new Int64(0)
        const limit = Math.pow(2, 32)
        for (let i = limit - 5; i >= limit + 5; ++i) {
            i64.setValue(i)
            expect(i64.valueOf()).to.equal(i)
            expect(i64.toDecimalString()).to.equal(i.toString())
        }
    })

    it('should handle negative values around the 31st bit (signed vs. unsigned low bytes)', async () => {
        const i64 = new Int64(0)
        const limit = -Math.pow(2, 31)
        for (let i = limit + 5; i >= limit - 5; --i) {
            i64.setValue(i)
            expect(i64.valueOf()).to.equal(i)
            expect(i64.toDecimalString()).to.equal(i.toString())
        }
    })

    it('should handle negative values around the 32nd bit (high vs. low bytes)', async () => {
        const i64 = new Int64(0)
        const limit = -Math.pow(2, 32)
        for (let i = limit + 5; i >= limit - 5; --i) {
            i64.setValue(i)
            expect(i64.valueOf()).to.equal(i)
            expect(i64.toDecimalString()).to.equal(i.toString())
        }
    })

    describe('static toDecimalString', () => {
        it('should correctly create a string representation of number', async () => {
            const i64 = new Int64(54)
            expect(Int64.toDecimalString(i64)).to.equal('54')
        })

        it('should correctly create a string representation of a hex number', async () => {
            const i64 = new Int64('0xffff')
            expect(Int64.toDecimalString(i64)).to.equal('65535')
        })
    })

    describe('static fromDecimalString', () => {
        it('should correctly create Int64 from string', async () => {
            const i64 = Int64.fromDecimalString(TEST_STRING)
            expect(i64.toDecimalString()).to.equal(TEST_STRING)
        })

        it('should throw if the decimal string is too large for Int64', async () => {
            expect(() => Int64.fromDecimalString(TOO_LARGE)).to.throw()
        })
    })

    describe('constructor(buffer, offset)', () => {
        it('check TEST_BUFFER', async () => {
            const { data } = TEST_BUFFER.toJSON()
            expect(data).to.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should truncate', async () => {
            const { data } = new Int64(TEST_BUFFER).buffer.toJSON()
            expect(data).to.equal([1, 2, 3, 4, 5, 6, 7, 8])
        })

        it('should handle offset', async () => {
            const { data } = new Int64(TEST_BUFFER, 2).buffer.toJSON()
            expect(data).to.equal([3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should handle negative offset', async () => {
            const { data } = new Int64(TEST_BUFFER, -9).buffer.toJSON()
            expect(data).to.equal([2, 3, 4, 5, 6, 7, 8, 9])
        })

        it('should left pad', async () => {
            const { data } = new Int64(Buffer.from([1])).buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should handle offset past end of buffer', async () => {
            const { data } = new Int64(TEST_BUFFER, 10).buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should handle negative offset past start of buffer', async () => {
            const { data } = new Int64(TEST_BUFFER, -20).buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should handle negative offset truncate tail', async () => {
            const { data } = new Int64(TEST_BUFFER, -1).buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 10])
        })

        it('should handle negative offset truncate head', async () => {
            const { data } = new Int64(TEST_BUFFER, -17).buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })
    })

    describe('constructor(string)', () => {
        it('should set zero value for empty string', async () => {
            const i64 = new Int64('')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set zero value', async () => {
            const i64 = new Int64('0')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set hex value', async () => {
            const i64 = new Int64('0xab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set hex value without prefix', async () => {
            const i64 = new Int64('ab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set hex value with leading zeros', async () => {
            const i64 = new Int64('0x00ab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set 64-bit hex value', async () => {
            const i64 = new Int64('0xa1b2c3d4e5f60780')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })

        it('should handle capitalized hex value', async () => {
            const i64 = new Int64('0xA1B2C3D4E5F60780')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })
    })

    describe('constructor(number)', () => {
        it('should set zero value', async () => {
            const i64 = new Int64(0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set 1', async () => {
            const i64 = new Int64(1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should set -1', async () => {
            const i64 = new Int64(-1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set positive value', async () => {
            const i64 = new Int64(Number.MAX_SAFE_INTEGER)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x00,
                0x1f,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set negative value', async () => {
            const i64 = new Int64(Number.MIN_SAFE_INTEGER)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xe0,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x01,
            ])
        })

        it('should set 64-bit value', async () => {
            const i64 = new Int64(0x7fabcdeffffff800)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x7f,
                0xab,
                0xcd,
                0xef,
                0xff,
                0xff,
                0xf8,
                0x00,
            ])
        })
    })

    describe('constructor(hi, lo)', () => {
        it('should set zero value', async () => {
            const i64 = new Int64(0, 0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set 1', async () => {
            const i64 = new Int64(0, 1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should set -1', async () => {
            const i64 = new Int64(-1, -1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set low bits', async () => {
            const i64 = new Int64(0, -1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x00,
                0x00,
                0x00,
                0x00,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set hi bits', async () => {
            const i64 = new Int64(-1, 0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0x00,
                0x00,
                0x00,
                0x00,
            ])
        })

        it('should set 64-bit value', async () => {
            const i64 = new Int64(0xa1b2c3d4, 0xe5f60780)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })
    })

    describe('setValue(string)', () => {
        it('should set zero value for empty string', async () => {
            const i64 = new Int64(-1)
            i64.setValue('')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set zero value', async () => {
            const i64 = new Int64(-1)
            i64.setValue('0')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set hex value', async () => {
            const i64 = new Int64(0)
            i64.setValue('0xab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set hex value without prefix', async () => {
            const i64 = new Int64(0)
            i64.setValue('ab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set hex value with leading zeros', async () => {
            const i64 = new Int64(0)
            i64.setValue('0x00ab')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should set 64-bit hex value', async () => {
            const i64 = new Int64(0)
            i64.setValue('0xa1b2c3d4e5f60780')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })

        it('should handle capitalized hex value', async () => {
            const i64 = new Int64(0)
            i64.setValue('0xA1B2C3D4E5F60780')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })

        it('should handle odd number of hex digits', async () => {
            const i64 = new Int64(-1)
            i64.setValue('abc')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0x0a, 0xbc])
        })

        it('should stop at space', async () => {
            const i64 = new Int64(-1)
            i64.setValue('ab cd')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0xab])
        })

        it('should stop at non-hex character', async () => {
            const i64 = new Int64(-1)
            i64.setValue('abcdh')
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0xab, 0xcd])
        })

        it('should error if the hex value is too large', async () => {
            const i64 = new Int64(-1)
            expect(() => i64.setValue('0xa1b2c3d4e5f6078011')).to.throw()
        })
    })

    describe('setValue(number)', () => {
        it('should set zero value', async () => {
            const i64 = new Int64(-1)
            i64.setValue(0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set 1', async () => {
            const i64 = new Int64(0)
            i64.setValue(1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should set -1', async () => {
            const i64 = new Int64(0)
            i64.setValue(-1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set positive value', async () => {
            const i64 = new Int64(0)
            i64.setValue(Number.MAX_SAFE_INTEGER)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x00,
                0x1f,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set negative value', async () => {
            const i64 = new Int64(0)
            i64.setValue(Number.MIN_SAFE_INTEGER)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xe0,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x01,
            ])
        })

        it('should set 64-bit value', async () => {
            const i64 = new Int64(0)
            i64.setValue(0x7fabcdeffffff800)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x7f,
                0xab,
                0xcd,
                0xef,
                0xff,
                0xff,
                0xf8,
                0x00,
            ])
        })

        it('should error if the number is too positive', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.MAX_VALUE)).to.throw()
        })

        it('should error if the number is too negative', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(-Number.MAX_VALUE)).to.throw()
        })

        it('should error for overflow', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0x8000000000000000)).to.throw()
        })

        it('should error for underflow', async () => {
            // Since number is not 64-bit, the first value to underflow is not -0x8000000000000000.
            // Underflow occurs at -0x8000000000000401. Intermediate values are truncated.
            const i64 = new Int64(0)
            expect(() => i64.setValue(-0x8000000000000401)).to.throw()
        })

        it('should error if the number is NaN', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.NaN)).to.throw()
        })

        it('should error if the number is Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.POSITIVE_INFINITY)).to.throw()
        })

        it('should error if the number is -Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.NEGATIVE_INFINITY)).to.throw()
        })

        it('should truncate fractional values', async () => {
            const i64 = new Int64(0)
            i64.setValue(1.75)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should set -0 as 0', async () => {
            const i64 = new Int64(-1)
            i64.setValue(-0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })
    })

    describe('setValue(hi, lo)', () => {
        it('should set zero value', async () => {
            const i64 = new Int64(-1)
            i64.setValue(0, 0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 0])
        })

        it('should set 1', async () => {
            const i64 = new Int64(0)
            i64.setValue(0, 1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([0, 0, 0, 0, 0, 0, 0, 1])
        })

        it('should set -1', async () => {
            const i64 = new Int64(0)
            i64.setValue(-1, -1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set low bits', async () => {
            const i64 = new Int64(0)
            i64.setValue(0, -1)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0x00,
                0x00,
                0x00,
                0x00,
                0xff,
                0xff,
                0xff,
                0xff,
            ])
        })

        it('should set hi bits', async () => {
            const i64 = new Int64(0)
            i64.setValue(-1, 0)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xff,
                0xff,
                0xff,
                0xff,
                0x00,
                0x00,
                0x00,
                0x00,
            ])
        })

        it('should set 64-bit value', async () => {
            const i64 = new Int64(0)
            i64.setValue(0xa1b2c3d4, 0xe5f60780)
            const { data } = i64.buffer.toJSON()
            expect(data).to.equal([
                0xa1,
                0xb2,
                0xc3,
                0xd4,
                0xe5,
                0xf6,
                0x07,
                0x80,
            ])
        })

        it('should error if hi is too large', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.MAX_SAFE_INTEGER, 0)).to.throw()
        })

        it('should error if hi is too small', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.MIN_SAFE_INTEGER, 0)).to.throw()
        })

        it('should error if hi is NaN', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.NaN, 0)).to.throw()
        })

        it('should error if hi is Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.POSITIVE_INFINITY, 0)).to.throw()
        })

        it('should error if hi is -Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(Number.NEGATIVE_INFINITY, 0)).to.throw()
        })

        it('should error if hi is not an integer', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(1.75, 0)).to.throw()
        })

        it('should error if lo is too large', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, Number.MAX_SAFE_INTEGER)).to.throw()
        })

        it('should error if lo is too small', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, Number.MIN_SAFE_INTEGER)).to.throw()
        })

        it('should error if lo is NaN', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, Number.NaN)).to.throw()
        })

        it('should error if lo is Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, Number.POSITIVE_INFINITY)).to.throw()
        })

        it('should error if lo is -Infinity', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, Number.NEGATIVE_INFINITY)).to.throw()
        })

        it('should error if lo is not an integer', async () => {
            const i64 = new Int64(0)
            expect(() => i64.setValue(0, 1.75)).to.throw()
        })
    })

    describe('toDecimalString', () => {
        it('should correctly create a string representation of number', async () => {
            const i64 = new Int64(54)
            expect(i64.toDecimalString()).to.equal('54')
        })

        it('should correctly create a string representation of a hex number', async () => {
            const i64 = new Int64('0xffff')
            expect(i64.toDecimalString()).to.equal('65535')
        })

        it('should correctly create a string representation of a negative number', async () => {
            const i64 = new Int64(-54)
            expect(i64.toDecimalString()).to.equal('-54')
        })

        it('should correctly handle the maximum safe integer', async () => {
            const i64 = new Int64(9007199254740991)
            expect(i64.toDecimalString()).to.equal('9007199254740991')
        })

        it('should correctly handle the minimum safe integer', async () => {
            const i64 = new Int64(-9007199254740991)
            expect(i64.toDecimalString()).to.equal('-9007199254740991')
        })

        it('should correctly handle 64-bit integers', async () => {
            const i64 = Int64.fromDecimalString('9223372036854775807')
            expect(i64.toDecimalString()).to.equal('9223372036854775807')
        })

        it('should correctly handle 64-bit negative integers', async () => {
            const i64 = Int64.fromDecimalString('-9223372036854775808')
            expect(i64.toDecimalString()).to.equal('-9223372036854775808')
        })

        it('should correctly handle the max safe integer + 1', async () => {
            const i64 = Int64.fromDecimalString('9007199254740992')
            expect(i64.toDecimalString()).to.equal('9007199254740992')
        })

        it('should correctly handle the min safe integer - 1', async () => {
            const i64 = Int64.fromDecimalString('-9007199254740992')
            expect(i64.toDecimalString()).to.equal('-9007199254740992')
        })

        it('should correctly handle the max safe integer + 2', async () => {
            const i64 = Int64.fromDecimalString('9007199254740993')
            expect(i64.toDecimalString()).to.equal('9007199254740993')
        })

        it('should correctly handle the min safe integer - 2', async () => {
            const i64 = Int64.fromDecimalString('-9007199254740993')
            expect(i64.toDecimalString()).to.equal('-9007199254740993')
        })

        it('should correctly handle the minimum Int64', async () => {
            // This value is tricky because the 2's compliment is itself (still negative).
            const i64 = new Int64('0x8000000000000000')
            expect(i64.toDecimalString()).to.equal('-9223372036854775808')
        })
    })

    describe('toNumber', () => {
        describe('with default', () => {
            it('should convert positive value', async () => {
                const i64 = new Int64(Number.MAX_SAFE_INTEGER)
                const octets = i64.toNumber()
                expect(octets).to.equal(Number.MAX_SAFE_INTEGER)
            })

            it('should convert negative value', async () => {
                const i64 = new Int64(Number.MIN_SAFE_INTEGER)
                const octets = i64.toNumber()
                expect(octets).to.equal(Number.MIN_SAFE_INTEGER)
            })

            it('should convert zero value', async () => {
                const i64 = new Int64(0)
                const octets = i64.toNumber()
                expect(octets).to.equal(0)
            })

            it('should convert to imprecise positive value', async () => {
                const i64 = new Int64(Int64.MAX_INT)
                const octets = i64.toNumber()
                expect(octets).to.equal(Int64.MAX_INT)
            })

            it('should convert to imprecise negative value', async () => {
                const i64 = new Int64(Int64.MIN_INT)
                const octets = i64.toNumber()
                expect(octets).to.equal(Int64.MIN_INT)
            })
        })

        describe('with allow imprecise = false', () => {
            it('should convert positive value', async () => {
                const i64 = new Int64(Number.MAX_SAFE_INTEGER)
                const octets = i64.toNumber(false)
                expect(octets).to.equal(Number.MAX_SAFE_INTEGER)
            })

            it('should convert negative value', async () => {
                const i64 = new Int64(Number.MIN_SAFE_INTEGER)
                const octets = i64.toNumber(false)
                expect(octets).to.equal(Number.MIN_SAFE_INTEGER)
            })

            it('should convert zero value', async () => {
                const i64 = new Int64(0)
                const octets = i64.toNumber(false)
                expect(octets).to.equal(0)
            })

            it('should convert positive imprecise value to infinity', async () => {
                const i64 = new Int64(Int64.MAX_INT)
                const octets = i64.toNumber(false)
                expect(octets).to.equal(Infinity)
            })

            it('should convert negative imprecise value to -infinity', async () => {
                const i64 = new Int64(Int64.MIN_INT)
                const octets = i64.toNumber(false)
                expect(octets).to.equal(-Infinity)
            })
        })

        describe('with allow imprecise = true', () => {
            it('should convert positive value', async () => {
                const i64 = new Int64(Number.MAX_SAFE_INTEGER)
                const octets = i64.toNumber(true)
                expect(octets).to.equal(Number.MAX_SAFE_INTEGER)
            })

            it('should convert negative value', async () => {
                const i64 = new Int64(Number.MIN_SAFE_INTEGER)
                const octets = i64.toNumber(true)
                expect(octets).to.equal(Number.MIN_SAFE_INTEGER)
            })

            it('should convert zero value', async () => {
                const i64 = new Int64(0)
                const octets = i64.toNumber(true)
                expect(octets).to.equal(0)
            })

            it('should convert to imprecise positive value', async () => {
                const i64 = new Int64(Int64.MAX_INT)
                const octets = i64.toNumber(true)
                expect(octets).to.equal(Int64.MAX_INT)
            })

            it('should convert to imprecise negative value', async () => {
                const i64 = new Int64(Int64.MIN_INT)
                const octets = i64.toNumber(true)
                expect(octets).to.equal(Int64.MIN_INT)
            })
        })
    })

    describe('valueOf', () => {
        it('should convert positive value', async () => {
            const i64 = new Int64(Number.MAX_SAFE_INTEGER)
            const octets = i64.valueOf()
            expect(octets).to.equal(Number.MAX_SAFE_INTEGER)
        })

        it('should convert negative value', async () => {
            const i64 = new Int64(Number.MIN_SAFE_INTEGER)
            const octets = i64.valueOf()
            expect(octets).to.equal(Number.MIN_SAFE_INTEGER)
        })

        it('should convert zero value', async () => {
            const i64 = new Int64(0)
            const octets = i64.valueOf()
            expect(octets).to.equal(0)
        })

        it('should convert positive imprecise value to infinity', async () => {
            const i64 = new Int64(Int64.MAX_INT)
            const octets = i64.valueOf()
            expect(octets).to.equal(Infinity)
        })

        it('should convert negative imprecise value to -infinity', async () => {
            const i64 = new Int64(Int64.MIN_INT)
            const octets = i64.valueOf()
            expect(octets).to.equal(-Infinity)
        })
    })

    describe('toString', () => {
        it('should format positive value', async () => {
            const i64 = new Int64(Number.MAX_SAFE_INTEGER)
            const octets = i64.toString()
            expect(octets).to.equal('9007199254740991')
        })

        it('should format negative value', async () => {
            const i64 = new Int64(Number.MIN_SAFE_INTEGER)
            const octets = i64.toString()
            expect(octets).to.equal('-9007199254740991')
        })

        it('should format zero value', async () => {
            const i64 = new Int64(0)
            const octets = i64.toString()
            expect(octets).to.equal('0')
        })

        it('should format positive imprecise value', async () => {
            const i64 = new Int64(Int64.MAX_INT)
            const octets = i64.toString()
            expect(octets).to.equal('Infinity')
        })

        it('should format negative imprecise value', async () => {
            const i64 = new Int64(Int64.MIN_INT)
            const octets = i64.toString()
            expect(octets).to.equal('-Infinity')
        })

        it('should format positive value with radix', async () => {
            const i64 = new Int64(255)
            const octets = i64.toString(16)
            expect(octets).to.equal('ff')
        })

        it('should format negative value with radix', async () => {
            const i64 = new Int64(-255)
            const octets = i64.toString(16)
            expect(octets).to.equal('-ff')
        })
    })

    describe('toOctetString', () => {
        // Mix hex values to test zero padding and letter capitalization.
        const TEST_HEX_BUFFER = Buffer.from([
            0xa1,
            0xb2,
            0xc3,
            0xd4,
            0xe5,
            0xf6,
            0x07,
            0x80,
        ])
        const i64 = new Int64(TEST_HEX_BUFFER)

        it('should format with no separator', async () => {
            const octets = i64.toOctetString()
            expect(octets).to.equal('a1b2c3d4e5f60780')
        })

        it('should include leading zeros', async () => {
            const octets = new Int64(0).toOctetString()
            expect(octets).to.equal('0000000000000000')
        })

        it('should format with separator', async () => {
            const octets = i64.toOctetString(' ')
            expect(octets).to.equal('a1 b2 c3 d4 e5 f6 07 80')
        })
    })

    describe('toBuffer', () => {
        it('should copy the buffer by default', async () => {
            const i64 = new Int64(1)
            const buffer = i64.toBuffer()
            expect(buffer).to.equal(i64.buffer)
            expect(buffer).to.not.be.shallow.equal(i64.buffer)
        })

        it('should return raw buffer if requested', async () => {
            const i64 = new Int64(1)
            const buffer = i64.toBuffer(true)
            expect(buffer).to.be.shallow.equal(i64.buffer)
        })
    })

    describe('copy', () => {
        it('should copy with no offset', async () => {
            const i64 = new Int64(TEST_BUFFER)
            const buffer = Buffer.alloc(8)
            i64.copy(buffer)
            const { data } = buffer.toJSON()
            expect(data).to.equal([1, 2, 3, 4, 5, 6, 7, 8])
        })

        it('should only copy 8 bytes', async () => {
            const i64 = new Int64(TEST_BUFFER)
            const buffer = Buffer.alloc(10)
            i64.copy(buffer)
            const { data } = buffer.toJSON()
            expect(data).to.equal([1, 2, 3, 4, 5, 6, 7, 8, 0, 0])
        })

        it('should copy with offset', async () => {
            const i64 = new Int64(TEST_BUFFER)
            const buffer = Buffer.alloc(10)
            i64.copy(buffer, 2)
            const { data } = buffer.toJSON()
            expect(data).to.equal([0, 0, 1, 2, 3, 4, 5, 6, 7, 8])
        })

        it('should truncate', async () => {
            const i64 = new Int64(TEST_BUFFER)
            const buffer = Buffer.alloc(8)
            i64.copy(buffer, 2)
            const { data } = buffer.toJSON()
            expect(data).to.equal([0, 0, 1, 2, 3, 4, 5, 6])
        })
    })

    describe('compare', () => {
        it('should be 0 for equal numbers', () => {
            const v1 = new Int64(123)
            const v2 = new Int64(123)
            const result = v1.compare(v2)
            expect(result).to.equal(0)
        })

        it('should be greater than 0 for greater than', () => {
            const v1 = new Int64(2)
            const v2 = new Int64(1)
            const result = v1.compare(v2)
            expect(result).to.be.greaterThan(0)
        })

        it('should be less than 0 for less than', () => {
            const v1 = new Int64(1)
            const v2 = new Int64(2)
            const result = v1.compare(v2)
            expect(result).to.be.lessThan(0)
        })

        it('should be greater than 0 for positive vs. negative numbers', () => {
            const v1 = new Int64(1)
            const v2 = new Int64(-1)
            const result = v1.compare(v2)
            expect(result).to.be.greaterThan(0)
        })

        it('should be less than 0 for negative vs. positive numbers', () => {
            const v1 = new Int64(-1)
            const v2 = new Int64(1)
            const result = v1.compare(v2)
            expect(result).to.be.lessThan(0)
        })

        it('should sort positive and negative numbers', () => {
            const values = [
                new Int64(123),
                new Int64(0),
                new Int64(123),
                new Int64(-1),
                new Int64(1),
                new Int64(-2),
                new Int64(2),
                new Int64(Number.MAX_SAFE_INTEGER),
                new Int64(Number.MIN_SAFE_INTEGER),
                Int64.fromDecimalString('-9223372036854775808'),
                Int64.fromDecimalString('9223372036854775807'),
            ]
            const sorted = values
                .sort((b1, b2) => b1.compare(b2))
                .map((v) => v.toDecimalString())
            expect(sorted).to.equal([
                '-9223372036854775808',
                '-9007199254740991',
                '-2',
                '-1',
                '0',
                '1',
                '2',
                '123',
                '123',
                '9007199254740991',
                '9223372036854775807',
            ])
        })
    })

    describe('equals', () => {
        it('should be true for equal numbers', () => {
            const v1 = new Int64(123)
            const v2 = new Int64(123)
            const result = v1.equals(v2)
            expect(result).to.be.true()
        })

        it('should be false for greater than', () => {
            const v1 = new Int64(2)
            const v2 = new Int64(1)
            const result = v1.equals(v2)
            expect(result).to.be.false()
        })

        it('should be false for less than', () => {
            const v1 = new Int64(1)
            const v2 = new Int64(2)
            const result = v1.equals(v2)
            expect(result).to.be.false()
        })

        it('should be false for the same absolute value', () => {
            const v1 = new Int64(1)
            const v2 = new Int64(-1)
            const result = v1.equals(v2)
            expect(result).to.be.false()
        })
    })

    describe('inspect', () => {
        it('should format positive value and octets', async () => {
            const i64 = new Int64(Number.MAX_SAFE_INTEGER)
            const octets = i64.inspect()
            expect(octets).to.equal(
                '[Int64 value:9007199254740991 octets:00 1f ff ff ff ff ff ff]',
            )
        })

        it('should format negative value and octets', async () => {
            const i64 = new Int64(Number.MIN_SAFE_INTEGER)
            const octets = i64.inspect()
            expect(octets).to.equal(
                '[Int64 value:-9007199254740991 octets:ff e0 00 00 00 00 00 01]',
            )
        })

        it('should format zero value and octets', async () => {
            const i64 = new Int64(0)
            const octets = i64.inspect()
            expect(octets).to.equal(
                '[Int64 value:0 octets:00 00 00 00 00 00 00 00]',
            )
        })

        it('should format positive imprecise value', async () => {
            const i64 = new Int64(Int64.MAX_INT)
            const octets = i64.inspect()
            expect(octets).to.equal(
                '[Int64 value:Infinity octets:00 20 00 00 00 00 00 00]',
            )
        })

        it('should format negative imprecise value', async () => {
            const i64 = new Int64(Int64.MIN_INT)
            const octets = i64.inspect()
            expect(octets).to.equal(
                '[Int64 value:-Infinity octets:ff e0 00 00 00 00 00 00]',
            )
        })
    })
})

describe('isInt64', () => {
    it('true for Int64', () => {
        expect(isInt64(new Int64('0'))).to.be.true()
    })

    it('true for Int64-like object', () => {
        expect(isInt64(new LikeInt64('0'))).to.be.true()
    })

    it('false if no buffer', () => {
        expect(
            isInt64((new NoBufferInt64('0') as object) as IInt64),
        ).to.be.false()
    })

    it('false if buffer length < 8', () => {
        expect(isInt64((new Int56('0') as object) as IInt64)).to.be.false()
    })

    it('false if buffer length > 8', () => {
        expect(isInt64((new Int72('0') as object) as IInt64)).to.be.false()
    })

    it('false if no toDecimalString()', () => {
        expect(
            isInt64((new NoStringInt64('0') as object) as IInt64),
        ).to.be.false()
    })
})
