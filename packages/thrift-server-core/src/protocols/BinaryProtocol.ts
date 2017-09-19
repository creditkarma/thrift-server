import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import Thrift = require('thrift/lib/nodejs/lib/thrift/thrift')
// TODO: Implement this ourselves
const Type = Thrift.Type

import { ITransport } from '../transports/Transport'
import { IProtocol } from './Protocol'

export class BinaryProtocol implements IProtocol {
  private transport: ITransport

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
  public readMessageBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readMessageEnd(): void {
    throw new Error('Method not implemented.')
  }
  public readStructBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readStructEnd(): void {
    throw new Error('Method not implemented.')
  }
  public readFieldBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readFieldEnd(): void {
    throw new Error('Method not implemented.')
  }
  public readMapBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readMapEnd(): void {
    throw new Error('Method not implemented.')
  }
  public readListBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readListEnd(): void {
    throw new Error('Method not implemented.')
  }
  public readSetBegin(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  public readSetEnd(): void {
    throw new Error('Method not implemented.')
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
    const byte: number = binary.readByte(chunk)
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
  public skip(type: any): void {
    throw new Error('Method not implemented.')
  }
}
