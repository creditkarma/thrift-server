/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/binary.js
 */
const POW_8 = Math.pow(2, 8)
const POW_16 = Math.pow(2, 16)
const POW_24 = Math.pow(2, 24)
const POW_32 = Math.pow(2, 32)
const POW_40 = Math.pow(2, 40)
const POW_48 = Math.pow(2, 48)
const POW_52 = Math.pow(2, 52)
const POW_1022 = Math.pow(2, 1022)

export function readByte(byte: number): number {
  return byte > 127 ? (byte - 256) : byte
}

export function readI16(buf: Buffer, offset: number = 0): number {
  offset = offset || 0
  let v = buf[offset + 1]
  v += buf[offset] << 8
  if (buf[offset] & 128) {
    v -= POW_16
  }
  return v
}

export function readI32(buf: Buffer, offset: number = 0): number {
  let result: number = buf[offset + 3]
  result += buf[offset + 2] << 8
  result += buf[offset + 1] << 16
  result += buf[offset] * POW_24
  if (buf[offset] & 0x80) {
    result -= POW_32
  }
  return result
}

export function readDouble(buf: Buffer, offset: number = 0): number {
  const signed: number = buf[offset] & 0x80
  let e: number = (buf[offset + 1] & 0xF0) >> 4
  e += (buf[offset] & 0x7F) << 4

  let m: number = buf[offset + 7]
  m += buf[offset + 6] << 8
  m += buf[offset + 5] << 16
  m += buf[offset + 4] * POW_24
  m += buf[offset + 3] * POW_32
  m += buf[offset + 2] * POW_40
  m += (buf[offset + 1] & 0x0F) * POW_48

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

export function writeI16(buf: Buffer, i16: number): Buffer {
  buf[1] = i16 & 0xff
  i16 = i16 >> 8

  buf[0] = i16 & 0xff
  return buf
}

export function writeI32(buf: Buffer, i32: number): Buffer {
  buf[3] = i32 & 0xff
  i32 = i32 >> 8

  buf[2] = i32 & 0xff
  i32 = i32 >> 8

  buf[1] = i32 & 0xff
  i32 = i32 >> 8

  buf[0] = i32 & 0xff
  return buf
}

export function writeDouble(buf: Buffer, dub: number): Buffer {
  let m: number
  let e: number
  let c: number

  buf[0] = (dub < 0 ? 0x80 : 0x00)

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
      c = c * 2
    }

    if (e + 1023 >= 2047) {
      // Overflow
      m = 0
      e = 2047
    } else if (e + 1023 >= 1) {
      // Normalized - term order matters, as Math.pow(2, 52-e) and dub*Math.pow(2, 52) can overflow
      m = (dub * c - 1) * POW_52
      e = e + 1023
    } else {
      // Denormalized - also catches the '0' case, somewhat by chance
      m = (dub * POW_1022) * POW_52
      e = 0
    }
  }

  buf[1] = (e << 4) & 0xf0
  buf[0] |= (e >> 4) & 0x7f

  buf[7] = m & 0xff
  m = Math.floor(m / POW_8)
  buf[6] = m & 0xff
  m = Math.floor(m / POW_8)
  buf[5] = m & 0xff
  m = Math.floor(m / POW_8)
  buf[4] = m & 0xff
  m = m >> 8
  buf[3] = m & 0xff
  m = m >> 8
  buf[2] = m & 0xff
  m = m >> 8
  buf[1] |= m & 0x0f

  return buf
}
