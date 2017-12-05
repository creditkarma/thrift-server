/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/int64_util.js
 */
import Int64_Base = require('node-int64')

const POW2_24 = Math.pow(2, 24)
const POW2_31 = Math.pow(2, 31)
const POW2_32 = Math.pow(2, 32)
const POW10_11 = Math.pow(10, 11)

export class Int64 extends Int64_Base {
  public static fromDecimalString(text: string): Int64 {
    const negative: boolean = text.charAt(0) === '-'

    if (text.length < (negative ? 17 : 16)) {
      // The magnitude is smaller than 2^53.
      return new Int64(+text)

    } else if (text.length > (negative ? 20 : 19)) {
      throw new RangeError(`Too many digits for Int64: ${text}`)

    } else {
      // Most significant (up to 5) digits
      const high5 = +text.slice(negative ? 1 : 0, -15)
      let low = +text.slice(-15) + high5 * 2764472320  // The literal is 10^15 % 2^32
      let high = Math.floor(low / POW2_32) + high5 * 232830  // The literal is 10^15 / 2^&32
      low = low % POW2_32

      if (high >= POW2_31 &&
          !(negative && (high === POW2_31) && (low === 0))  // Allow minimum Int64
        ) {
        throw new RangeError('The magnitude is too large for Int64.')
      }

      if (negative) {
        // 2's complement
        high = ~high
        if (low === 0) {
          high = (high + 1) & 0xffffffff
        } else {
          low = ~low + 1
        }
        high = 0x80000000 | high
      }

      return new Int64(high, low)
    }
  }

  public toDecimalString(): string {
    const i64: Int64 = this
    let b = i64.buffer
    const o = i64.offset

    if ((!b[o] && !(b[o + 1] & 0xe0)) ||
        (!~b[o] && !~(b[o + 1] & 0xe0))) {
      // The magnitude is small enough.
      return i64.toString()

    } else {
      const negative = b[o] & 0x80

      if (negative) {
        // 2's complement
        let incremented = 0
        const buffer = new Buffer(8)
        for (let i = 7; i >= 0; --i) {
          buffer[i] = (~b[o + i] + (incremented ? 0 : 1)) & 0xff
          incremented = incremented | b[o + i]
        }
        b = buffer
      }
      const high2 = b[o + 1] + (b[o] << 8)
      // Lesser 11 digits with exceeding values but is under 53 bits capacity.
      const low: number = (
        b[o + 7] + (b[o + 6] << 8) + (b[o + 5] << 16)
        + b[o + 4] * POW2_24  // Bit shift renders 32th bit as sign, so use multiplication
        + (b[o + 3] + (b[o + 2] << 8)) * POW2_32 + high2 * 74976710656
      )  // The literal is 2^48 % 10^11
      // 12th digit and greater.
      const high = Math.floor(low / POW10_11) + high2 * 2814  // The literal is 2^48 / 10^11
      // Make it exactly 11 with leading zeros.
      const lowStr: string = ('00000000000' + String(low % POW10_11)).slice(-11)
      return (negative ? '-' : '') + String(high) + lowStr
    }
  }
}
