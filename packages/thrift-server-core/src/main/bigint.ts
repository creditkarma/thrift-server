export function readBigUInt64BE(buf: Buffer): bigint {
    let offset: number = 0
    const first: number = buf[offset]
    const last: number = buf[offset + 7]
    if (first === undefined || last === undefined) {
        throw new Error('Invalid')
    }

    const hi: number =
        first * 2 ** 24 +
        buf[++offset] * 2 ** 16 +
        buf[++offset] * 2 ** 8 +
        buf[++offset]

    const lo: number =
        buf[++offset] * 2 ** 24 +
        buf[++offset] * 2 ** 16 +
        buf[++offset] * 2 ** 8 +
        last

    return (BigInt(hi) << 32n) + BigInt(lo)
}

export function writeBigInt64BE(buf: Buffer, value: bigint): Buffer {
    return writeBigU_Int64BE(buf, value)
}

function writeBigU_Int64BE(buf: Buffer, value: bigint): Buffer {
    const offset: number = 0
    let lo: number = Number(value & 0xffffffffn)
    buf[offset + 7] = lo
    lo = lo >> 8
    buf[offset + 6] = lo
    lo = lo >> 8
    buf[offset + 5] = lo
    lo = lo >> 8
    buf[offset + 4] = lo

    let hi: number = Number((value >> 32n) & 0xffffffffn)
    buf[offset + 3] = hi
    hi = hi >> 8
    buf[offset + 2] = hi
    hi = hi >> 8
    buf[offset + 1] = hi
    hi = hi >> 8
    buf[offset] = hi

    // return offset + 8
    return buf
}
