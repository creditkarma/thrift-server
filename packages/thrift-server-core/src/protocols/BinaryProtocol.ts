import Thrift = require('thrift/lib/nodejs/lib/thrift/thrift')

import { ITransport } from '../transports/Transport'

export interface IProtocol {
  // TODO: Just proxies to transport flush
  flush(): void

  // TODO: no seqid?
  writeMessageBegin(name, type, seqid): void
  writeMessageEnd(): void

  // TODO: not implemented
  writeStructBegin(name): void
  writeStructEnd(): void

  // TODO: no seqid?
  writeFieldBegin(name, type, id): void
  // TODO: not implemented
  writeFieldEnd(): void
  writeFieldStop(): void

  writeMapBegin(ktype, vtype, size): void
  writeMapEnd(): void

  writeListBegin(etype, size): void
  writeListEnd(): void

  writeSetBegin(etype, size): void
  writeSetEnd(): void

  writeBool(value: boolean): void
  writeByte(value: number): void
  writeI16(value: number): void
  writeI32(value: number): void
  writeI64(value: number): void
  writeDouble(value: number): void
  // TODO: avoid this abstraction
  writeStringOrBinary(name, encoding, arg): void
  writeString(value: string): void
  writeBinary(value: Buffer): void

  // TODO: concrete return type
  readMessageBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readMessageEnd(): void

  // TODO: concrete return type
  readStructBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readStructEnd(): void

  // TODO: concrete return type
  readFieldBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readFieldEnd(): void

  // TODO: concrete return type
  readMapBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readMapEnd(): void

  // TODO: concrete return type
  readListBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readListEnd(): void

  // TODO: concrete return type
  readSetBegin(): Promise<any>
  // TODO: not implemented
  // Should these return promises?
  readSetEnd(): void

  readBool(): Promise<boolean>
  readByte(): Promise<number>
  readI16(): Promise<number>
  readI32(): Promise<number>
  readI64(): Promise<number>
  readDouble(): Promise<number>
  readBinary(): Promise<Buffer>
  readString(): Promise<string>

  // TODO: is this needed?
  getTransport(): ITransport

  // TODO: type this argument
  skip(type): void
}

export class BinaryProtocol implements IProtocol {
  private transport: ITransport

  constructor(transport: ITransport) {
    this.transport = transport
  }

  public flush(): void {
    throw new Error('Method not implemented.')
  }

  public writeMessageBegin(name: any, type: any, seqid: any): void {
    throw new Error('Method not implemented.')
  }
  public writeMessageEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeStructBegin(name: any): void {
    throw new Error('Method not implemented.')
  }
  public writeStructEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeFieldBegin(name: any, type: any, id: any): void {
    throw new Error('Method not implemented.')
  }
  public writeFieldEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeFieldStop(): void {
    throw new Error('Method not implemented.')
  }
  public writeMapBegin(ktype: any, vtype: any, size: any): void {
    throw new Error('Method not implemented.')
  }
  public writeMapEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeListBegin(etype: any, size: any): void {
    throw new Error('Method not implemented.')
  }
  public writeListEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeSetBegin(etype: any, size: any): void {
    throw new Error('Method not implemented.')
  }
  public writeSetEnd(): void {
    throw new Error('Method not implemented.')
  }
  public writeBool(value: boolean): void {
    throw new Error('Method not implemented.')
  }
  public writeByte(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeI16(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeI32(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeI64(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeDouble(value: number): void {
    throw new Error('Method not implemented.')
  }
  public writeStringOrBinary(name: any, encoding: any, arg: any): void {
    throw new Error('Method not implemented.')
  }
  public writeString(value: string): void {
    throw new Error('Method not implemented.')
  }
  public writeBinary(value: Buffer): void {
    throw new Error('Method not implemented.')
  }
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
  public readBool(): Promise<boolean> {
    // TODO: Is this better as Promise.resolve and tag the readBool method as async?
    return new Promise(async (resolve) => {
      const byte = await this.transport.readByte()
      const bool = (byte === 0) ? false : true
      resolve(bool)
    })
  }
  public readByte(): Promise<number> {
    return this.transport.readByte()
  }
  public readI16(): Promise<number> {
    return this.transport.readI16()
  }
  public readI32(): Promise<number> {
    return this.transport.readI32()
  }
  public readI64(): Promise<number> {
    // TODO: Why doesn't the transport define this?
    throw new Error('Method not implemented.')
  }
  public readDouble(): Promise<number> {
    return this.transport.readDouble()
  }
  public readBinary(): Promise<Buffer> {
    return new Promise(async (resolve) => {
      const size = await this.transport.readI32()
      // TODO: Can this be incorporated into the transport.readBuffer method?
      if (size === 0) {
        return resolve(Buffer.alloc(0))
      }

      // TODO: Is this just guarding an underrun?
      if (size < 0) {
        throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.NEGATIVE_SIZE, 'Negative binary size')
      }
      resolve(this.transport.read(size))
    })
  }
  public readString(): Promise<string> {
    return new Promise(async (resolve) => {
      const size = await this.transport.readI32()
      // TODO: Can this be incorporated into the transport.readString method?
      if (size === 0) {
        return resolve('')
      }

      // TODO: Is this just guarding an underrun?
      if (size < 0) {
        throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.NEGATIVE_SIZE, 'Negative string size')
      }
      resolve(this.transport.readString(size))
    })
  }
  // TODO: Where is this used? Maybe we can get rid of it
  public getTransport(): ITransport {
    return this.transport
  }
  public skip(type: any): void {
    throw new Error('Method not implemented.')
  }
}
