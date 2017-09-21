import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

import { ITransport } from './Transport'

const HEADER_SIZE = 4

export default class FramedTransport implements ITransport {
  private inBuf: Buffer
  private readCursor: number

  constructor(input: Buffer | undefined) {
    this.inBuf = input
  }

  public read(size: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.ensureAvailable(HEADER_SIZE)
      // TODO: Does this actually need to be copied? If not, it could be sliced
      const header = this.inBuf.slice(0, HEADER_SIZE) // 4 is frame header size
      this.readCursor += HEADER_SIZE

      const frameSize = binary.readI32(header, 0)

      this.ensureAvailable(size)
      const chunk = this.inBuf.slice(this.readCursor, this.readCursor + size)
      this.readCursor += size
      resolve(chunk)
    })
  }

  // tslint:disable-next-line:no-empty
  public write() {

  }

  // tslint:disable-next-line:no-empty
  public flush() {

  }

  // tslint:disable-next-line:no-empty
  public consume() {}
  // tslint:disable-next-line:no-empty
  public borrow(): { buf: Buffer; readIndex: number; writeIndex: number; } {
    return { buf: Buffer.alloc(0), readIndex: 0, writeIndex: 0 }
  }
  // tslint:disable-next-line:no-empty
  public commitPosition() {}
  // tslint:disable-next-line:no-empty
  public rollbackPosition() {}

  public isOpen(): boolean {
    return true
  }

  // tslint:disable-next-line:no-empty
  public open() {}

  // tslint:disable-next-line:no-empty
  public close() {}

  private ensureAvailable(size) {
    if (this.readCursor + size > this.inBuf.length) {
      throw new InputBufferUnderrunError()
    }
  }
}
