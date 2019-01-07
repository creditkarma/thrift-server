/**
 * This implementation is largely taken a combination of two exiting libraries:
 * 1. node-int64
 * 2. apache thrift
 *
 * This takes elements of those two projects and reemplements the logic in TypeScript.
 * In regard to node-int64 we also remove the use of `new Buffer()` in favor of `Buffer.alloc()`.
 *
 * The orginal source can be found here:
 * https://github.com/broofa/node-int64
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/int64_util.js
 *
 */
const POW2_24 = Math.pow(2, 24)
const POW2_31 = Math.pow(2, 31)
const POW2_32 = Math.pow(2, 32)
const POW10_11 = Math.pow(10, 11)

/**
 * Support for handling 64-bit int numbers in Javascript (node.js)
 *
 * JS Numbers are IEEE-754 binary double-precision floats, which limits the
 * range of values that can be represented with integer precision to:
 *
 * 2^^53 <= N <= 2^53
 *
 * Int64 objects wrap a node Buffer that holds the 8-bytes of int64 data.  These
 * objects operate directly on the buffer which means that if they are created
 * using an existing buffer then setting the value will modify the Buffer, and
 * vice-versa.
 *
 * Internal Representation
 *
 * The internal buffer format is Big Endian.  I.e. the most-significant byte is
 * at buffer[0], the least-significant at buffer[7].  For the purposes of
 * converting to/from JS native numbers, the value is assumed to be a signed
 * integer stored in 2's complement form.
 *
 * For details about IEEE-754 see:
 * http://en.wikipedia.org/wiki/Double_precision_floating-point_format
 */

// Useful masks and values for bit twiddling
const VAL32 = 0x100000000

// Map for converting hex octets to strings
const _HEX: Array<string> = []
for (let i = 0; i < 256; i++) {
    _HEX[i] = (i > 0xf ? '' : '0') + i.toString(16)
}

//
// Int64
//

/**
 * Constructor accepts any of the following argument types:
 *
 * new Int64(buffer[, offset=0]) - Existing Buffer with byte offset
 * new Int64(Uint8Array[, offset=0]) - Existing Uint8Array with a byte offset
 * new Int64(string)             - Hex string (throws if n is outside int64 range)
 * new Int64(number)             - Number (throws if n is outside int64 range)
 * new Int64(hi, lo)             - Raw bits as two 32-bit values
 */
export class Int64 {
    // Max integer value that JS can accurately represent
    public static MAX_INT: number = Math.pow(2, 53)
    // Min integer value that JS can accurately represent
    public static MIN_INT: number = -Math.pow(2, 53)

    public static toDecimalString(i64: Int64 | number): string {
        if (typeof i64 === 'number') {
            return (new Int64(i64)).toDecimalString()
        } else {
            return i64.toDecimalString()
        }
    }

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
            let low: number = +text.slice(-15) + high5 * 2764472320 // The literal is 10^15 % 2^32
            let high: number = Math.floor(low / POW2_32) + high5 * 232830 // The literal is 10^15 / 2^&32
            low = low % POW2_32

            if (
                high >= POW2_31 &&
                !(negative && high === POW2_31 && low === 0) // Allow minimum Int64
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

    public readonly buffer: Buffer
    private offset: number

    constructor(buf: Buffer | Uint16Array | number, offset?: number)
    constructor(str: string)
    constructor(...args: Array<any>) {
        if (args[0] instanceof Buffer) {
            this.buffer = args[0]
            this.offset = args[1] || 0
        } else if (
            Object.prototype.toString.call(args[0]) === '[object Uint8Array]'
        ) {
            // Under Browserify, Buffers can extend Uint8Arrays rather than an
            // instance of Buffer. We could assume the passed in Uint8Array is actually
            // a buffer but that won't handle the case where a raw Uint8Array is passed
            // in. We allocate a new Buffer just in case.
            this.buffer = Buffer.from(args[0])
            this.offset = args[1] || 0
        } else {
            this.buffer = Buffer.alloc(8)
            this.offset = 0
            this.setValue(args[0], args[1])
        }
    }

    /**
     * Set the value. Takes any of the following arguments:
     *
     * setValue(string) - A hexidecimal string
     * setValue(number) - Number (throws if n is outside int64 range)
     * setValue(hi, lo) - Raw bits as two 32-bit values
     */
    public setValue(str: string): void
    public setValue(hi: number | string, lo?: number): void
    public setValue(hi: any, lo?: any): void {
        let negate: boolean = false
        if (lo === undefined) {
            if (typeof hi === 'number') {
                // Simplify bitfield retrieval by using abs() value.  We restore sign
                // later
                negate = hi < 0
                hi = Math.abs(hi)
                lo = hi % VAL32
                hi = hi / VAL32
                if (hi > VAL32) {
                    throw new RangeError(hi + ' is outside Int64 range')
                } else {
                    hi = hi | 0
                }
            } else if (typeof hi === 'string') {
                hi = (hi + '').replace(/^0x/, '')
                lo = hi.substr(-8)
                hi = hi.length > 8 ? hi.substr(0, hi.length - 8) : ''
                hi = parseInt(hi, 16)
                lo = parseInt(lo, 16)
            } else {
                throw new Error(hi + ' must be a Number or String')
            }
        }

        // Technically we should throw if hi or lo is outside int32 range here, but
        // it's not worth the effort. Anything past the 32'nd bit is ignored.

        // Copy bytes to buffer
        const b: Buffer = this.buffer
        const o: number = this.offset
        for (let i = 7; i >= 0; i--) {
            b[o + i] = lo & 0xff
            lo = i === 4 ? hi : lo >>> 8
        }

        // Restore sign of passed argument
        if (negate) {
            this._2scomp()
        }
    }

    public toDecimalString(): string {
        const i64: Int64 = this
        let b = i64.buffer
        const o = i64.offset

        if ((!b[o] && !(b[o + 1] & 0xe0)) || (!~b[o] && !~(b[o + 1] & 0xe0))) {
            // The magnitude is small enough.
            return i64.toString()
        } else {
            const negative = b[o] & 0x80

            if (negative) {
                // 2's complement
                let incremented = 0
                const buffer = Buffer.alloc(8)
                for (let i = 7; i >= 0; --i) {
                    buffer[i] = (~b[o + i] + (incremented ? 0 : 1)) & 0xff
                    incremented = incremented | b[o + i]
                }
                b = buffer
            }

            const high2 = b[o + 1] + (b[o] << 8)

            // Lesser 11 digits with exceeding values but is under 53 bits capacity.
            const low: number =
                b[o + 7] +
                (b[o + 6] << 8) +
                (b[o + 5] << 16) +
                b[o + 4] * POW2_24 + // Bit shift renders 32th bit as sign, so use multiplication
                (b[o + 3] + (b[o + 2] << 8)) * POW2_32 +
                high2 * 74976710656 // The literal is 2^48 % 10^11

            // 12th digit and greater.
            const high = Math.floor(low / POW10_11) + high2 * 2814 // The literal is 2^48 / 10^11

            // Make it exactly 11 with leading zeros.
            const lowStr: string = (
                '00000000000' + String(low % POW10_11)
            ).slice(-11)

            return (negative ? '-' : '') + String(high) + lowStr
        }
    }

    /**
     * Convert to a native JS number.
     *
     * WARNING: Do not expect this value to be accurate to integer precision for
     * large (positive or negative) numbers!
     *
     * @param allowImprecise If true, no check is performed to verify the
     * returned value is accurate to integer precision.  If false, imprecise
     * numbers (very large positive or negative numbers) will be forced to +/-
     * Infinity.
     */
    public toNumber(allowImprecise: boolean = true): number {
        const buf = this.buffer
        const off = this.offset

        // Running sum of octets, doing a 2's complement
        const negate: number = buf[off] & 0x80
        let x: number = 0
        let carry: number = 1
        for (let i = 7, m = 1; i >= 0; i--, m *= 256) {
            let v = buf[off + i]

            // 2's complement for negative numbers
            if (negate) {
                v = (v ^ 0xff) + carry
                carry = v >> 8
                v = v & 0xff
            }

            x += v * m
        }

        // Return Infinity if we've lost integer precision
        if (!allowImprecise && x >= Int64.MAX_INT) {
            return negate ? -Infinity : Infinity
        }

        return negate ? -x : x
    }

    /**
     * Convert to a JS Number. Returns +/-Infinity for values that can't be
     * represented to integer precision.
     */
    public valueOf(): number {
        return this.toNumber(false)
    }

    /**
     * Return string value
     *
     * @param radix Just like Number#toString()'s radix
     */
    public toString(radix: number = 10): string {
        return this.valueOf().toString(radix)
    }

    /**
     * Return a string showing the buffer octets, with MSB on the left.
     *
     * @param sep separator string. default is '' (empty string)
     */
    public toOctetString(sep: string): string {
        const out = new Array(8)
        const buf = this.buffer
        const off = this.offset
        for (let i = 0; i < 8; i++) {
            out[i] = _HEX[buf[off + i]]
        }
        return out.join(sep || '')
    }

    /**
     * Returns the int64's 8 bytes in a buffer.
     *
     * @param {bool} [rawBuffer=false]  If no offset and this is true, return the internal buffer.  Should only be used if
     *                                  you're discarding the Int64 afterwards, as it breaks encapsulation.
     */
    public toBuffer(rawBuffer: Buffer): Buffer {
        if (rawBuffer && this.offset === 0) {
            return this.buffer
        } else {
            const out = Buffer.alloc(8)
            this.buffer.copy(out, 0, this.offset, this.offset + 8)
            return out
        }
    }

    /**
     * Copy 8 bytes of int64 into target buffer at target offset.
     *
     * @param {Buffer} targetBuffer       Buffer to copy into.
     * @param {number} [targetOffset=0]   Offset into target buffer.
     */
    public copy(targetBuffer: Buffer, targetOffset: number = 0): void {
        this.buffer.copy(
            targetBuffer,
            targetOffset,
            this.offset,
            this.offset + 8,
        )
    }

    /**
     * Returns a number indicating whether this comes before or after or is the
     * same as the other in sort order.
     *
     * @param {Int64} other  Other Int64 to compare.
     */
    public compare(other: Int64): number {
        // If sign bits differ ...
        if (
            (this.buffer[this.offset] & 0x80) !==
            (other.buffer[other.offset] & 0x80)
        ) {
            return other.buffer[other.offset] - this.buffer[this.offset]
        }

        // otherwise, compare bytes lexicographically
        for (let i = 0; i < 8; i++) {
            if (
                this.buffer[this.offset + i] !== other.buffer[other.offset + i]
            ) {
                return (
                    this.buffer[this.offset + i] -
                    other.buffer[other.offset + i]
                )
            }
        }

        return 0
    }

    /**
     * Returns a boolean indicating if this integer is equal to other.
     *
     * @param {Int64} other  Other Int64 to compare.
     */
    public equals(other: Int64): boolean {
        return this.compare(other) === 0
    }

    /**
     * Pretty output in console.log
     */
    public inspect(): string {
        return (
            '[Int64 value:' + this + ' octets:' + this.toOctetString(' ') + ']'
        )
    }

    public _2scomp(): void {
        const buf = this.buffer
        const off = this.offset
        let carry: number = 1

        for (let i = off + 7; i >= off; i--) {
            const v = (buf[i] ^ 0xff) + carry
            buf[i] = v & 0xff
            carry = v >> 8
        }
    }
}
