/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/buffered_transport.js
 */
import * as binary from '../binary'
import { InputBufferUnderrunError } from '../errors'
import { TTransport } from './TTransport'

export class BufferedTransport extends TTransport {
    public static receiver(data: Buffer): BufferedTransport {
        const reader = new BufferedTransport(Buffer.alloc(data.length))
        data.copy(reader.buffer, 0, 0)
        return reader
    }

    protected readCursor: number
    protected writeCursor: number
    protected outBuffers: Array<Buffer>

    constructor(buffer?: Buffer) {
        super(buffer || Buffer.alloc(0))
        this.readCursor = 0
        this.writeCursor = (buffer !== undefined) ? buffer.length : 0
        this.outBuffers = []
    }

    public remaining(): Buffer {
        const remainingSize = this.writeCursor - this.readCursor
        const remainingBuffer = Buffer.alloc(remainingSize)
        if (remainingSize > 0) {
            this.buffer.copy(remainingBuffer, 0, this.readCursor, this.writeCursor)
        }
        return remainingBuffer
    }

    public rollbackPosition(): void {
        this.readCursor = 0
    }

    public isOpen(): boolean {
        return true
    }

    public open(): boolean {
        return true
    }

    public close(): boolean {
        return true
    }

    public read(len: number): Buffer {
        this.ensureAvailable(len)
        const buf = new Buffer(len)
        this.buffer.copy(buf, 0, this.readCursor, this.readCursor + len)
        this.readCursor += len
        return buf
    }

    public readByte(): number {
        this.ensureAvailable(1)
        return binary.readByte(this.buffer[this.readCursor++])
    }

    public readI16(): number {
        this.ensureAvailable(2)
        const i16: number = binary.readI16(this.buffer, this.readCursor)
        this.readCursor += 2
        return i16
    }

    public readI32(): number {
        this.ensureAvailable(4)
        const i32: number = binary.readI32(this.buffer, this.readCursor)
        this.readCursor += 4
        return i32
    }

    public readDouble(): number {
        this.ensureAvailable(8)
        const d: number = binary.readDouble(this.buffer, this.readCursor)
        this.readCursor += 8
        return d
    }

    public readString(len: number): string {
        this.ensureAvailable(len)
        const str: string = this.buffer.toString('utf8', this.readCursor, this.readCursor + len)
        this.readCursor += len
        return str
    }

    public consume(len: number): void {
        this.readCursor += len
    }

    public write(buf: Buffer): void {
        this.resize(buf.length)
        buf.copy(this.buffer, this.writeCursor)
        this.outBuffers.push(buf)
        this.writeCursor += buf.length
    }

    public flush(): Buffer {
        const returnData: Buffer = this.buffer
        this.buffer = Buffer.alloc(0)
        return returnData
    }

    private resize(len: number): void {
        if (this.buffer.length < this.writeCursor + len) {
            const saved: Buffer = this.buffer
            this.buffer = Buffer.alloc(this.writeCursor + len)
            saved.copy(this.buffer, 0, 0)
        }
    }

    private ensureAvailable(len: number): void {
        if (this.readCursor + len > this.buffer.length) {
            throw new InputBufferUnderrunError()
        }
    }
}
