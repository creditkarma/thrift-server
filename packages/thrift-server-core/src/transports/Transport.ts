export interface ITransport {
  open(): void
  close(): void

  read(size: number): Promise<Buffer>

  // write(buf: Buffer | string): void
  write(buf: Buffer): void

  flush(): void

  // TODO: Below methods might not be needed
  isOpen(): boolean
}
