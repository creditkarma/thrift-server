import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

// TODO: Replace with custom/better implementations
import { decode as decodeFrame } from 'frame-stream'
import { read as streamRead } from 'promised-read'

import from = require('from2')

import { ITransport } from './Transport'

const HEADER_SIZE = 4

const frameOpts = {
  getLength: (header) => binary.readI32(header, 0),
  lengthSize: HEADER_SIZE,
}

export default class FramedTransport implements ITransport {
  private stream: NodeJS.ReadWriteStream
  private reader: NodeJS.ReadWriteStream
  private outBuffers: Buffer[] = []
  private outSize: number = 0

  constructor(input: NodeJS.ReadWriteStream) {
    this.stream = input
    // TODO: A better impl would allow us to combine decode/encode frame in the same pipeline
    this.reader = input.pipe(decodeFrame(frameOpts))
  }

  public async read(size: number): Promise<Buffer> {
    const chunk = await streamRead(this.reader, size)

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
    this.outSize += buf.length
  }

  public flush(): void {
    // TODO: A better frame-stream impl would avoid having to calculate our own header
    const header = Buffer.alloc(4)
    binary.writeI32(header, this.outSize)
    const msg = [header].concat(this.outBuffers)

    from(msg).pipe(this.stream)

    this.outBuffers = []
    this.outSize = 0
  }

  public isOpen(): boolean {
    return true
  }

  // tslint:disable-next-line:no-empty
  public open() {}

  // tslint:disable-next-line:no-empty
  public close() {}
}
