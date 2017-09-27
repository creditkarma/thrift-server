import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import Thrift = require('thrift/lib/nodejs/lib/thrift/thrift')
// TODO: Implement this ourselves
const Type = Thrift.Type

import { ITransport } from '../transports/Transport'
import { IProtocol } from './Protocol'

// JavaScript supports only numeric doubles, therefore even hex values are always signed.
// The largest integer value which can be represented in JavaScript is +/-2^53.
// Bitwise operations convert numbers to 32 bit integers but perform sign extension
// upon assigning values back to variables.
const VERSION_MASK = -65536   // 0xffff0000
const VERSION_1 = -2147418112 // 0x80010000
const TYPE_MASK = 0x000000ff

export default class BinaryProtocol implements IProtocol {
  private transport: ITransport
  private strictRead: boolean = false

  constructor(transport: ITransport) {
    this.transport = transport
  }

  // TODO: Might not need to be on Protocol
  public flush(): void {
    this.transport.flush()
  }

  /* Write */
  public writeMessageBegin(name: string, type: number, seqid: number): void {
    // TODO: This isn't handling strictWrite. Is it needed?
    this.writeString(name)
    this.writeByte(type)
    this.writeI32(seqid)
    // TODO: Ensure we don't need seqId stuff
  }
  public writeMessageEnd(): void {
    // TODO: Ensure we don't need seqId stuff
  }
  public writeStructBegin(name: any): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeStructEnd(): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeFieldBegin(name: string, type: number, id: number): void {
    // TODO: Why is name passed if not used?
    this.writeByte(type)
    this.writeI16(id)
  }
  public writeFieldEnd(): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeFieldStop(): void {
    this.writeByte(Type.STOP)
  }
  public writeMapBegin(ktype: number, vtype: number, size: number): void {
    this.writeByte(ktype)
    this.writeByte(vtype)
    this.writeI32(size)
  }
  public writeMapEnd(): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeListBegin(etype: number, size: number): void {
    this.writeByte(etype)
    this.writeI32(size)
  }
  public writeListEnd(): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeSetBegin(etype: number, size: number): void {
    this.writeByte(etype)
    this.writeI32(size)
  }
  public writeSetEnd(): void {
    // TODO: This isn't implemented in thrift core
  }
  public writeBool(value: boolean): void {
    const byte = value ? 1 : 0
    const buf = Buffer.alloc(1)
    buf.writeUInt8(byte, 0)
    this.transport.write(buf)
  }
  public writeByte(value: number): void {
    // TODO: Is this correct? Yay buffers
    const buf = Buffer.alloc(1)
    buf.writeUInt8(value, 0)
    this.transport.write(buf)
  }
  public writeI16(value: number): void {
    this.transport.write(binary.writeI16(Buffer.alloc(2), value))
    // const buf = Buffer.alloc(2)
    // // TODO: LE or BE? If I'm reading "binary" properly, looks like BE
    // buf.writeInt16BE(value, 0)
    // this.write(buf)
  }
  public writeI32(value: number): void {
    this.transport.write(binary.writeI32(Buffer.alloc(4), value))
  }
  public writeI64(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeDouble(value: number): void {
    this.transport.write(binary.writeDouble(Buffer.alloc(8), value))
  }
  public writeString(value: string): void {
    const buf = Buffer.from(value, 'utf8')
    // TODO: Decouple?
    this.writeI32(buf.length)
    this.transport.write(buf)
  }
  public writeBinary(value: Buffer): void {
    throw new Error('Method not implemented.')
  }

  /* Read */
  public async readMessageBegin(): Promise<any> {
    const sz = await this.readI32()
    let type
    let name
    let seqid

    if (sz < 0) {
      // tslint:disable-next-line:no-bitwise
      const version = sz & VERSION_MASK
      if (version !== VERSION_1) {
        console.log('BAD: ' + version)
        throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.BAD_VERSION,
          'Bad version in readMessageBegin: ' + sz)
      }
      // tslint:disable-next-line:no-bitwise
      type = sz & TYPE_MASK
      name = await this.readString()
      seqid = await this.readI32()
    } else {
      if (this.strictRead) {
        throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.BAD_VERSION, 'No protocol version header')
      }
      name = await this.transport.read(sz)
      type = await this.readByte()
      seqid = await this.readI32()
    }
    return {fname: name, mtype: type, rseqid: seqid}
  }
  public async readMessageEnd(): Promise<void> {
    // No implementation
  }
  public async readStructBegin(): Promise<any> {
    return { fname: '' }
  }
  public async readStructEnd(): Promise<void> {
    // No implementation
  }
  public async readFieldBegin(): Promise<any> {
    const type = await this.readByte()
    if (type === Type.STOP) {
      return {fname: null, ftype: type, fid: 0}
    }
    const id = await this.readI16()
    return {fname: null, ftype: type, fid: id}
  }
  public async readFieldEnd(): Promise<void> {
    // No implementation
  }
  public async readMapBegin(): Promise<any> {
    const ktype = await this.readByte()
    const vtype = await this.readByte()
    const size = await this.readI32()
    return {ktype, vtype, size}
  }
  public async readMapEnd(): Promise<void> {
    // No implementation
  }
  public async readListBegin(): Promise<any> {
    const etype = await this.readByte()
    const size = await this.readI32()
    return {etype, size}
  }
  public async readListEnd(): Promise<void> {
    // No implementation
  }
  public async readSetBegin(): Promise<any> {
    const etype = await this.readByte()
    const size = await this.readI32()
    return {etype, size}
  }
  public async readSetEnd(): Promise<void> {
    // No implementation
  }
  // TODO: Is this better to duplicate from readByte to not couple the methods?
  public async readBool(): Promise<boolean> {
    const chunk: Buffer = await this.transport.read(1)
    const byte: number = binary.readByte(chunk)
    const bool: boolean = (byte === 0) ? false : true
    return bool
  }
  public async readByte(): Promise<number> {
    const chunk: Buffer = await this.transport.read(1)
    // TODO: binary.readByte should accept a Buffer
    const byte: number = binary.readByte(chunk[0])
    return byte
  }
  public async readI16(): Promise<number> {
    const chunk: Buffer = await this.transport.read(2)
    const i16: number = binary.readI16(chunk)
    return i16
  }
  public async readI32(): Promise<number> {
    const chunk: Buffer = await this.transport.read(4)
    const i32: number = binary.readI32(chunk)
    return i32
  }
  public async readI64(): Promise<number> {
    // TODO: Implement
    throw new Error('Method not implemented.')
  }
  public async readDouble(): Promise<number> {
    const chunk: Buffer = await this.transport.read(8)
    const dub: number = binary.readDouble(chunk)
    return dub
  }
  public async readBinary(): Promise<Buffer> {
    // TODO: Is this fine to be coupled?
    const size: number = await this.readI32()
    if (size === 0) {
      return Buffer.alloc(0)
    }

    // TODO: Is this just guarding an underrun?
    if (size < 0) {
      // TODO: Throw vs Reject
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.NEGATIVE_SIZE, 'Negative binary size')
    }
    const chunk: Buffer = await this.transport.read(size)
    return chunk
  }
  public async readString(): Promise<string> {
    // TODO: Is this fine to be coupled?
    const size: number = await this.readI32()
    if (size === 0) {
      return ''
    }

    // TODO: Is this just guarding an underrun?
    if (size < 0) {
      // TODO: Throw vs Reject
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.NEGATIVE_SIZE, 'Negative string size')
    }
    const chunk: Buffer = await this.transport.read(size)
    const str: string = chunk.toString('utf8')
    return str
  }
  // TODO: Where is this used? Maybe we can get rid of it
  public getTransport(): ITransport {
    return this.transport
  }
  public async skip(type: any): Promise<void> {
    switch (type) {
      case Type.STOP:
        return
      case Type.BOOL:
        await this.readBool()
        return
      case Type.BYTE:
        await this.readByte()
        return
      case Type.I16:
        await this.readI16()
        return
      case Type.I32:
        await this.readI32()
        return
      case Type.I64:
        await this.readI64()
        return
      case Type.DOUBLE:
        await this.readDouble()
        return
      case Type.STRING:
        await this.readString()
        return
      case Type.STRUCT:
        await this.readStructBegin()
        while (true) {
          const r = await this.readFieldBegin()
          if (r.ftype === Type.STOP) {
            break
          }
          await this.skip(r.ftype)
          await this.readFieldEnd()
        }
        await this.readStructEnd()
        return
      case Type.MAP:
        const mapBegin = await this.readMapBegin()
        for (let i = 0; i < mapBegin.size; ++i) {
          await this.skip(mapBegin.ktype)
          await this.skip(mapBegin.vtype)
        }
        await this.readMapEnd()
        return
      case Type.SET:
        const setBegin = await this.readSetBegin()
        for (let i2 = 0; i2 < setBegin.size; ++i2) {
          await this.skip(setBegin.etype)
        }
        await this.readSetEnd()
        return
      case Type.LIST:
        const listBegin = await this.readListBegin()
        for (let i3 = 0; i3 < listBegin.size; ++i3) {
          await this.skip(listBegin.etype)
        }
        await this.readListEnd()
        return
      default:
        throw new  Error('Invalid type: ' + type)
    }
  }
}
