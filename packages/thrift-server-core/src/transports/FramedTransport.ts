import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

// TODO: Replace with custom/better implementations
import { decode as decodeFrame } from 'frame-stream'
import { read as streamRead } from 'promised-read'

import { ITransport } from './Transport'

const HEADER_SIZE = 4

export default class FramedTransport implements ITransport {
  private stream: NodeJS.ReadWriteStream
  private outBuffers: Buffer[] = []
  private outSize: number = 0
  private onFlush

  constructor(input: NodeJS.ReadWriteStream, callback) {
    const frameOpts = {
      getLength: (header) => binary.readI32(header, 0),
      lengthSize: HEADER_SIZE,
    }
    if (input) {
      this.stream = input.pipe(decodeFrame())
    }
    this.onFlush = callback
  }

  public async read(size: number): Promise<Buffer> {
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
    this.outSize += buf.length
  }

  public flush(): void {
    // TODO: This doesn't seem used
    // If the seqid of the callback is available pass it to the onFlush
    // Then remove the current seqid
    // const seqid = this._seqid
    // this._seqid = null

    const out = Buffer.alloc(this.outSize)
    let pos = 0
    this.outBuffers.forEach((buf) => {
      // TODO: Do these actually need to be copied? If not, it could be joined by Buffer.concat
      buf.copy(out, pos, 0)
      pos += buf.length
    })

    if (this.onFlush) {
      // TODO: optimize this better, allocate one buffer instead of both:
      const msg = Buffer.alloc(out.length + 4)
      binary.writeI32(msg, out.length)
      out.copy(msg, 4, 0, out.length)
      this.onFlush(msg)
    }

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
