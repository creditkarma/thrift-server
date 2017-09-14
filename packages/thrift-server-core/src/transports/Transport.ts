export interface ITransport {
  commitPosition(): void
  rollbackPosition(): void

  read(size: number): Promise<Buffer>
  readByte(): Promise<number>
  readBool(): Promise<boolean>
  readI16(): Promise<number>
  readI32(): Promise<number>
  readDouble(): Promise<number>
  readString(size: number): Promise<string>

  write(buf: Buffer | string): void
  writeByte(value: number): void
  writeBool(value: boolean): void
  writeI16(value: number): void
  writeI32(value: number): void
  writeDouble(value: number): void
  writeString(value: string): void

  flush(): void

  consume(bytesConsumed: number): void

  borrow(): { buf: Buffer; readIndex: number; writeIndex: number; }

  isOpen(): boolean
  open(): void
  close(): void
}
