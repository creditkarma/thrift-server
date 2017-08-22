import binary = require('thrift/lib/nodejs/lib/thrift/binary')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift//input_buffer_underrun_error')

// tslint:disable

export class BufferedTransport {

  constructor() {
    // this.defaultReadBufferSize = 1024;
    // this.writeBufferSize = 512; // Soft Limit
    // this.inBuf = new Buffer(this.defaultReadBufferSize);
    // this.readCursor = 0;
    // this.writeCursor = 0; // for input buffer
    // this.outBuffers = [];
    // this.outCount = 0;
    // this.onFlush = callback;
  }

  public commitPosition() {}

  public rollbackPosition() {}

  public ensureAvailable() {}

  public read() {}

  public readByte() {}
  public readI16() {}
  public readI32() {}
  public readDouble() {}
  public readString() {}

  public write() {}

  // Maybe this should return a promise
  public flush() {}

  public consume() {}

  // TODO: It doesn't seem like this is used
  public borrow() {}

  // TODO: They don't implement these
  public isOpen() {}
  public open() {}
  public close() {}
}
