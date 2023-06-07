/**
 * This implementation is largely taken a combination of two exiting libraries:
 * 1. node-int64
 * 2. apache thrift
 *
 * This takes elements of those two projects and re-implements the logic in TypeScript.
 * In regard to node-int64 we also remove the use of `new Buffer()` in favor of `Buffer.alloc()`.
 *
 * The original source can be found here:
 * https://github.com/broofa/node-int64
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/int64_util.js
 *
 * Note that bit operators convert values to 32-bit integers.
 * Other than the >>> operators, the result is a signed 32-bit integer.
 * Operating on 64-bit values requires using arithmatic operators instead.
 */
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

// Map for converting hex octets to strings
const _HEX: Array<string> = []
for (let i = 0; i < 256; i++) {
    _HEX[i] = (i > 0xf ? '' : '0') + i.toString(16)
}

// Hex string format.
const HEX_REGEX = /^(?:0x)?([0-9a-fA-F]+)/

// 8 bytes
const BYTE_COUNT = 8

/**
 * 64-bit integer value as high and low 32-bit integers.
 *
 * This type just indicates the expectation of 32-bit integer values.
 * The number range is not enforced for performance.
 * The behavior is not defined if the values do not match expectations.
 *
 * The high and low values may be signed or unsigned.
 */
interface IHiLo {
    /** High 32 bits. */
    hi: number
    /** Low 32 bits. */
    lo: number
}

/**
 * 64-bit integer value as high and low signed 32-bit integers.
 *
 * This type just indicates the expectation of signed values.
 * The number range is not enforced for performance.
 * The behavior is not defined if the values do not match expectations.
 *
 * It would be possible to define distinct classes with validation for safety if this were to be made public but
 * for now it is limited to this module.
 */
interface IHiLoSigned extends IHiLo {
    /** Additional field for type checking so that IHiLoSigned is not the same as IHiLo. */
    signed: true
    /** High signed 32 bits. */
    hi: number
    /** Low signed 32 bits. */
    lo: number
}

/**
 * 64-bit integer value as high and low unsigned 32-bit integers and a negative flag.
 *
 * This type just indicates the expectation of unsigned values.
 * The number range is not enforced for performance.
 * The behavior is not defined if the values do not match expectations.
 *
 * It would be possible to define distinct classes with validation for safety if this were to be made public but
 * for now it is limited to this module.
 */
interface IHiLoUnsigned extends IHiLo {
    /** True if the value is negative */
    negative: boolean
    /** High signed 32 bits. */
    hi: number
    /** Low signed 32 bits. */
    lo: number
}

/**
 * Calculate i64 * -1.
 *
 * 2's compliment of the 64-bit integer value.
 * The hi and lo values may be signed or unsigned.
 *
 * @param i64 64-bit integer as high and low 32-bit values.
 */
function hiLoNeg({ hi, lo }: IHiLo): IHiLo {
    // 2's compliment is ~i64 + 1.
    const nlo = ~lo + 1
    const carry = nlo === 0 ? 1 : 0
    const nhi = ~hi + carry

    return {
        hi: nhi,
        lo: nlo,
    }
}

/**
 * Convert from IHiLoSigned to IHiLoUnsigned.
 *
 * @param i64
 */
function hiLoSignedToUnsigned(i64: IHiLoSigned): IHiLoUnsigned {
    const negative = i64.hi < 0
    const { hi, lo } = negative ? hiLoNeg(i64) : i64
    return {
        negative,
        hi: hi >>> 0,
        lo: lo >>> 0,
    }
}

/**
 * Convert 64-bit integer value as high and low signed 32-bit integers to a number.
 *
 * May lose precision if the number is not a safe integer.
 * @see: Number.isSafeInteger()
 *
 * @param hi High signed 32-bits
 * @param lo Low signed 32-bits
 */
function hiLoSignedToNumber({ hi, lo }: IHiLoSigned): number {
    const carry = lo < 0 ? 1 : 0
    return (hi + carry) * POW2_32 + lo
}

/**
 * Convert the number to a 64-bit integer value as high and low signed 32-bit integers.
 *
 * Truncates number if it is not an integer.
 *
 * @param i64 Number
 */
function hiLoSignedFromNumber(i64: number): IHiLoSigned {
    // Truncate the input.
    i64 = Math.trunc(i64)

    const lo = i64 >> 0
    const carry = lo < 0 ? 1 : 0
    const hi = (i64 - lo) / POW2_32 - carry

    return { signed: true, hi, lo }
}

/**
 * Prepare the buffer for use in the Int64.
 *
 * Adjust for the offset and pad if necessary.
 *
 * @param source  Source buffer
 * @param offset  Offset to the bytes to use
 */
function prepBuffer(source: Buffer, offset: number): Buffer {
    // Use the buffer as-is if there is no offset and the buffer is the right size.
    if (offset === 0 && source.length === BYTE_COUNT) {
        return source
    }

    // Slice the buffer to adjust for the offset and length.
    const end =
        offset >= 0
            ? offset + BYTE_COUNT
            : Math.max(source.length + offset + BYTE_COUNT, 0)
    const slice = source.slice(offset, end)
    // Handle negative offsets that are still longer than the desired byte count.
    if (slice.length > BYTE_COUNT) {
        return slice.slice(0, BYTE_COUNT)
    }
    if (slice.length === BYTE_COUNT) {
        return slice
    }

    // The buffer is too small. Pad left.
    const out = Buffer.alloc(BYTE_COUNT)
    slice.copy(out, BYTE_COUNT - slice.length)

    return out
}

/**
 * Interface for a serializable 64-bit integer.
 *
 * The Int64 class implements a lot more functionality for using the 64-bit value.
 * This interface is for the types that can be written by TProtocol.
 */
export interface IInt64 {
    /**
     * 8-byte big-endian (network order) Buffer.
     */
    readonly buffer: Buffer

    /**
     * Returns the value as a signed decimal integer.
     */
    toDecimalString(): string
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
export class Int64 implements IInt64 {
    // Max integer value that JS can accurately represent
    public static MAX_INT: number = Math.pow(2, 53)
    // Min integer value that JS can accurately represent
    public static MIN_INT: number = -Math.pow(2, 53)

    public static toDecimalString(i64: Int64 | number): string {
        if (typeof i64 === 'number') {
            return `${i64}`
        } else {
            return i64.toDecimalString()
        }
    }

    public static fromBigInt(value: bigint): Int64 {
        const buf = Buffer.alloc(8)
        buf.writeBigInt64BE(value)
        return new Int64(buf)
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
            const remainder = +text.slice(-15) + high5 * 2764472320 // The literal is 10^15 % 2^32
            const hi = Math.floor(remainder / POW2_32) + high5 * 232830 // The literal is 10^15 / 2^&32
            const lo = remainder % POW2_32

            if (
                hi >= POW2_31 &&
                !(negative && hi === POW2_31 && lo === 0) // Allow minimum Int64
            ) {
                throw new RangeError('The magnitude is too large for Int64.')
            }

            if (negative) {
                const neg = hiLoNeg({ hi, lo })
                return new Int64(neg.hi, neg.lo)
            }

            return new Int64(hi, lo)
        }
    }

    /** @inheritDoc */
    public readonly buffer: Buffer

    constructor(buf: Buffer | Uint16Array | number, offset?: number)
    constructor(str: string)
    constructor(...args: Array<any>) {
        if (args[0] instanceof Buffer) {
            const source: Buffer = args[0]
            const offset: number = args[1] || 0
            this.buffer = prepBuffer(source, offset)
        } else if (
            Object.prototype.toString.call(args[0]) === '[object Uint8Array]'
        ) {
            // Under Browserify, Buffers can extend Uint8Arrays rather than an
            // instance of Buffer. We could assume the passed in Uint8Array is actually
            // a buffer but that won't handle the case where a raw Uint8Array is passed
            // in. We allocate a new Buffer just in case.
            const source: Buffer = Buffer.from(args[0])
            const offset: number = args[1] || 0
            this.buffer = prepBuffer(source, offset)
        } else {
            this.buffer = Buffer.alloc(BYTE_COUNT)
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
        if (lo === undefined) {
            if (typeof hi === 'number') {
                this.setNumber(hi)
                return
            }
            if (typeof hi === 'string') {
                this.setHexString(hi)
                return
            }
            throw new Error(hi + ' must be a Number or String')
        }

        if (typeof hi !== 'number' || typeof lo !== 'number') {
            throw new Error(`${hi} and ${lo} must be Numbers`)
        }

        this.setHiLo({ hi, lo })
    }

    public toBigInt(): bigint {
        return this.buffer.readBigInt64BE()
    }

    /** @inheritDoc */
    public toDecimalString(): string {
        // Get the number from the buffer.
        const i64 = this.read()

        // Use the number string if it is a safe integer.
        const value = hiLoSignedToNumber(i64)
        if (Number.isSafeInteger(value)) {
            return value.toString()
        }

        // Handle the 64-bit number.
        const { negative, hi, lo } = hiLoSignedToUnsigned(i64)

        // Top 2 bytes unsigned.
        const high2 = hi >>> 16

        // Lesser 11 digits with exceeding values but is under 53 bits capacity.
        const low: number =
            lo +
            (hi & 0x0000ffff) * POW2_32 + // Lower 2 bytes from the hi 4 bytes.
            high2 * 74976710656 // The literal is 2^48 % 10^11

        // 12th digit and greater.
        const high = Math.floor(low / POW10_11) + high2 * 2814 // The literal is 2^48 / 10^11

        // Make it exactly 11 with leading zeros.
        const lowStr: string = ('00000000000' + String(low % POW10_11)).slice(
            -11,
        )

        return (negative ? '-' : '') + String(high) + lowStr
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
        const x = hiLoSignedToNumber(this.read())

        if (!allowImprecise && !Number.isSafeInteger(x)) {
            return x < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
        }

        return x
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
    public toOctetString(sep: string = ''): string {
        if (!sep) {
            return this.buffer.toString('hex')
        }
        return Array.from(this.buffer, (num) => _HEX[num]).join(sep)
    }

    /**
     * Returns the int64's 8 bytes in a buffer.
     *
     * @param {boolean} [rawBuffer=false]  If no offset and this is true, return the internal buffer.
     *                                     Should only be used if you're discarding the Int64 afterwards,
     *                                     as it breaks encapsulation.
     */
    public toBuffer(rawBuffer: boolean = false): Buffer {
        if (rawBuffer) {
            return this.buffer
        }

        // Return a copy.
        const out = Buffer.alloc(BYTE_COUNT)
        this.buffer.copy(out)
        return out
    }

    /**
     * Copy 8 bytes of int64 into target buffer at target offset.
     *
     * @param {Buffer} targetBuffer       Buffer to copy into.
     * @param {number} [targetOffset=0]   Offset into target buffer.
     */
    public copy(targetBuffer: Buffer, targetOffset: number = 0): void {
        this.buffer.copy(targetBuffer, targetOffset)
    }

    /**
     * Returns a number indicating whether this comes before or after or is the
     * same as the other in sort order.
     *
     * @param {Int64} other  Other Int64 to compare.
     */
    public compare(other: Int64): number {
        // If sign bits differ ...
        if ((this.buffer[0] & 0x80) !== (other.buffer[0] & 0x80)) {
            return other.buffer[0] - this.buffer[0]
        }

        return this.buffer.compare(other.buffer)
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
     * Pretty output for console.log
     */
    public inspect(): string {
        return (
            '[Int64 value:' + this + ' octets:' + this.toOctetString(' ') + ']'
        )
    }

    /**
     * Set the value from a number.
     *
     * Truncates any fractional parts of the number.
     *
     * @param i64  Finite number in the Int64 range.
     */
    private setNumber(i64: number): void {
        // The value must be finite.
        if (!Number.isFinite(i64)) {
            throw new RangeError(`Value is not finite: ${i64}`)
        }

        const { hi, lo } = hiLoSignedFromNumber(i64)

        // Write the bytes to the buffer.
        try {
            // Do not use setHiLo(). The expected range and validation are different.
            this.buffer.writeInt32BE(hi, 0)
            this.buffer.writeInt32BE(lo, 4)
        } catch {
            // The error is in terms of the hi and lo values. Throw an error with the original value.
            throw new RangeError(`Value is outside the Int64 range: ${i64}`)
        }
    }

    /**
     * Sets the value from high/low 32-bit values.
     *
     * @param i64 64-bit integer as high/low 32-bit values.
     */
    private setHiLo(i64: IHiLo): void {
        const { hi, lo } = i64

        // The hi and lo values must be integers.
        if (!Number.isInteger(hi)) {
            throw new TypeError(`Hi is not an integer: ${hi}`)
        }
        if (!Number.isInteger(lo)) {
            throw new TypeError(`Lo is not an integer: ${lo}`)
        }

        // Passing hi >>> 0 and lo >>> 0 to writeUInt32BE() works for valid values but truncates values that are
        // out of range. By checking for signed values, the correct range checks are made.
        // The error message for being out of range is not very descriptive so the values are caught and re-thrown.
        try {
            if (hi < 0) {
                this.buffer.writeInt32BE(hi, 0)
            } else {
                this.buffer.writeUInt32BE(hi, 0)
            }
        } catch {
            throw new RangeError(`Hi is outside the Int64 range: ${hi}`)
        }
        try {
            if (lo < 0) {
                this.buffer.writeInt32BE(lo, 4)
            } else {
                this.buffer.writeUInt32BE(lo, 4)
            }
        } catch {
            throw new RangeError(`Lo is outside the Int64 range: ${lo}`)
        }
    }

    /**
     * Set the value from a hex string.
     *
     * @param source  Hex string
     */
    private setHexString(source: string): void {
        // Get the first captured group from the hex string.
        const matches = source.match(HEX_REGEX)
        const match = (matches && matches[1]) || ''
        // Expect an even number of characters. Pad left.
        const hex = (match.length % 2 === 0 ? '' : '0') + match
        const length = Buffer.byteLength(hex, 'hex')
        if (length > BYTE_COUNT) {
            throw new RangeError(source + ' is outside Int64 range')
        }
        // Pad left.
        const offset = BYTE_COUNT - length
        this.buffer.fill(0, 0, offset)
        this.buffer.write(hex, offset, length, 'hex')
    }

    /**
     * Get the high and low signed 32-bit values.
     */
    private read(): IHiLoSigned {
        return {
            signed: true,
            hi: this.buffer.readInt32BE(0),
            lo: this.buffer.readInt32BE(4),
        }
    }
}

/**
 * Check if i64 can be serialized as a 64-bit integer.
 *
 * Checking for `instanceof Int64` can be too specific a check.
 * For example, when there are multiple dependencies on different versions.
 * The dependencies may be duplicated and result in compatible `Int64` types for which `instanceof Int64` is false.
 *
 * @param i64  64-bit integer
 */
export function isInt64(i64: number | string | bigint | IInt64): i64 is IInt64 {
    return (
        i64 instanceof Int64 ||
        (typeof i64 === 'object' &&
            i64.buffer instanceof Buffer &&
            i64.buffer.length === BYTE_COUNT &&
            typeof i64.toDecimalString === 'function')
    )
}
