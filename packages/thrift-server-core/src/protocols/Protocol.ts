import { ITransport } from '../transports/Transport'

export interface IProtocol {
  // TODO: Just proxies to transport flush
  flush(): void

  // TODO: no seqid?
  // TODO: Ensure these arguments have proper typings
  writeMessageBegin(name: string, type: number, seqid: number): void
  writeMessageEnd(): void

  // TODO: not implemented
  writeStructBegin(name): void
  writeStructEnd(): void

  // TODO: no seqid?
  // TODO: Ensure these arguments have proper typings
  writeFieldBegin(name: string, type: number, id: number): void
  // TODO: not implemented
  writeFieldEnd(): void
  writeFieldStop(): void

  // TODO: Ensure these arguments have proper typings
  writeMapBegin(ktype: number, vtype: number, size: number): void
  writeMapEnd(): void

  // TODO: Ensure these arguments have proper typings
  writeListBegin(etype: number, size: number): void
  writeListEnd(): void

  // TODO: Ensure these arguments have proper typings
  writeSetBegin(etype: number, size: number): void
  writeSetEnd(): void

  writeBool(value: boolean): void
  writeByte(value: number): void
  writeI16(value: number): void
  writeI32(value: number): void
  writeI64(value: number): void
  writeDouble(value: number): void
  // TODO: avoid this abstraction
  // writeStringOrBinary(name, encoding, arg): void
  writeString(value: string): void
  // TODO: Should this be pushed into the Transport?
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
  // TODO: Should this be pushed into the Transport?
  readBinary(): Promise<Buffer>
  readString(): Promise<string>

  // TODO: is this needed?
  getTransport(): ITransport

  // TODO: type this argument
  skip(type): void
}
