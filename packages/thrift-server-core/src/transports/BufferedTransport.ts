import { Buffer } from 'buffer'
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

// TODO: Replace with custom/better implementation
import { read as streamRead } from 'promised-read'

import { ITransport } from './Transport'

export default class BufferedTransport implements ITransport {
  private stream: NodeJS.ReadWriteStream
  private outBuffers: Buffer[] = []
  private outSize: number = 0
  private onFlush

  constructor(input: NodeJS.ReadWriteStream, callback) {
    this.stream = input
    // TODO: Utilize duplex stream for writing instead of this onFlush
    this.onFlush = callback
  }

  // Set the seqid of the message in the client
  // So that callbacks can be found
  // setSeqId(seqid) {
  //   this._seqid = seqid;
  // }

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
    this.outSize += buf.length
  }

  // TODO: Maybe this should return a promise
  public flush(): void {
    // TODO: This doesn't seem used
    // If the seqid of the callback is available pass it to the onFlush
    // Then remove the current seqid
    // const seqid = this._seqid
    // this._seqid = null

    // TODO: If this returns a promise, should this resolve or reject?
    if (this.outSize < 1) {
      return
    }

    const msg = Buffer.alloc(this.outSize)
    let pos = 0
    this.outBuffers.forEach((buf) => {
      // TODO: Do these actually need to be copied? If not, it could be joined by Buffer.concat
      buf.copy(msg, pos, 0)
      pos += buf.length
    })

    if (this.onFlush) {
      this.onFlush(msg)
    }

    this.outBuffers = []
    this.outSize = 0
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
