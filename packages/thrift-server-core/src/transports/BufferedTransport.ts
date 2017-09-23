import { Buffer } from 'buffer'
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

// TODO: Replace with custom/better implementation
import { read as streamRead } from 'promised-read'

import from = require('from2')

import { ITransport } from './Transport'

export default class BufferedTransport implements ITransport {
  private stream: NodeJS.ReadWriteStream
  private outBuffers: Buffer[] = []

  constructor(input: NodeJS.ReadWriteStream) {
    this.stream = input
  }

  public async read(size: number): Promise<Buffer | undefined> {
    const chunk = await streamRead(this.stream, size)

    // Stream done, no more data
    if (chunk === null) {
      return
    }

    if (chunk.length < size || chunk.length > size) {
      throw new Error(`Wrong size. Expected: ${size} but got ${chunk.length}`)
    }

    return chunk
  }

  public write(buf: Buffer): void {
    this.outBuffers.push(buf)
  }

  public flush(): void {
    // TODO: Can write actually write this data?
    from(this.outBuffers).pipe(this.stream)

    this.outBuffers = []
  }

  // TODO: They don't implement these
  // TODO: This is probably not needed
  public isOpen(): boolean {
    return true
  }
  // tslint:disable-next-line:no-empty
  public open() {}
  // tslint:disable-next-line:no-empty
  public close() {}
}
