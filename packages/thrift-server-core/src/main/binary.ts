/**
 * This functions were originally taken from the Apache project and reimplemented in TypeScript.
 * They've been re-implemented using the Node.js Buffer methods to read and write numeric values.
 *
 * The original project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/binary.js
 */

// Skip value and offset validation if true.
const noAssert = true

/**
 * Read a byte as a signed value.
 *
 * @param byte IInt8 value
 */
export function readByte(byte: number): number {
    return byte > 127 ? byte - 256 : byte
}

/**
 * Read a 16-bit integer from the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param offset Offset
 */
export function readI16(bytes: Buffer, offset: number = 0): number {
    return bytes.readInt16BE(offset, noAssert)
}

/**
 * Read a 32-bit integer from the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param offset Offset
 */
export function readI32(bytes: Buffer, offset: number = 0): number {
    return bytes.readInt32BE(offset, noAssert)
}

/**
 * Read a double from the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param offset Offset
 */
export function readDouble(bytes: Buffer, offset: number = 0): number {
    return bytes.readDoubleBE(offset, noAssert)
}

/**
 * Write a 16-bit integer to the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param i16 16-bit integer
 */
export function writeI16(bytes: Buffer, i16: number): Buffer {
    bytes.writeInt16BE(i16, 0, noAssert)
    return bytes
}

/**
 * Write a 32-bit integer to the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param i32 32-bit integer
 */
export function writeI32(bytes: Buffer, i32: number): Buffer {
    bytes.writeInt32BE(i32, 0, noAssert)
    return bytes
}

/**
 * Write a double to the buffer at the given offset.
 *
 * Big-endian order.
 *
 * @param bytes Buffer
 * @param dub Double
 */
export function writeDouble(bytes: Buffer, dub: number): Buffer {
    bytes.writeDoubleBE(dub, 0, noAssert)
    return bytes
}

/**
 * Read a double from the buffer at the given offset.
 *
 * Little-endian order.
 *
 * @param bytes Buffer
 * @param offset Offset
 */
export function readDoubleLE(bytes: Buffer, offset: number = 0): number {
    return bytes.readDoubleLE(offset, noAssert)
}

/**
 * Write a double to the buffer at the given offset.
 *
 * Little-endian order.
 *
 * @param bytes Buffer
 * @param dub Double
 */
export function writeDoubleLE(bytes: Buffer, dub: number): Buffer {
    bytes.writeDoubleLE(dub, 0, noAssert)
    return bytes
}
