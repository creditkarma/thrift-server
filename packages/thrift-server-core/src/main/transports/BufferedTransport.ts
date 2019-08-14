/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://github.com/apache/thrift/blob/master/lib/nodejs/lib/thrift/buffered_transport.js
 */
import * as binary from '../binary'
import { InputBufferUnderrunError } from '../errors'
import { TTransport } from './TTransport'

const DEFAULT_READ_BUFFER_SIDE: number = 1024

export class BufferedTransport extends TTransport {
    public static receiver(data: Buffer): BufferedTransport {
        const reader = new BufferedTransport(Buffer.alloc(data.length))
        data.copy(reader.buffer, 0, 0)
        return reader
    }

    private readCursor: number
    private writeCursor: number
    private outBuffers: Array<Buffer>
    private outCount: number

    constructor(buffer?: Buffer) {
        super(buffer || Buffer.alloc(DEFAULT_READ_BUFFER_SIDE))
        this.readCursor = 0
        this.writeCursor = buffer !== undefined ? buffer.length : 0
        this.outBuffers = []
        this.outCount = 0
    }

    public remaining(): Buffer {
        const remainingSize = this.writeCursor - this.readCursor
        const remainingBuffer = Buffer.alloc(remainingSize)
        if (remainingSize > 0) {
            this.buffer.copy(
                remainingBuffer,
                0,
                this.readCursor,
                this.writeCursor,
            )
        }
        return remainingBuffer
    }

    public commitPosition(): void {
        const unreadSize: number = this.writeCursor - this.readCursor
        const bufSize: number =
            unreadSize * 2 > DEFAULT_READ_BUFFER_SIDE
                ? unreadSize * 2
                : DEFAULT_READ_BUFFER_SIDE
        const buf: Buffer = Buffer.alloc(bufSize)

        if (unreadSize > 0) {
            this.buffer.copy(buf, 0, this.readCursor, this.writeCursor)
        }

        this.readCursor = 0
        this.writeCursor = unreadSize
        this.buffer = buf
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
        const buf = Buffer.alloc(len)
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
        const str: string = this.buffer.toString(
            'utf8',
            this.readCursor,
            this.readCursor + len,
        )
        this.readCursor += len
        return str
    }

    public readAll(): string {
        return this.readString(this.buffer.length - this.readCursor)
    }

    public consume(len: number): void {
        this.readCursor += len
    }

    public write(buf: Buffer): void {
        if (buf instanceof Buffer) {
            this.outBuffers.push(buf)
            this.outCount += buf.length
        } else {
            throw new TypeError(`Expected buffer but found ${typeof buf}`)
        }
    }

    public flush(): Buffer {
        if (this.outCount < 1) {
            return Buffer.alloc(0)
        }

        const msg: Buffer = Buffer.alloc(this.outCount)
        let pos: number = 0

        this.outBuffers.forEach((buf: Buffer): void => {
            buf.copy(msg, pos, 0)
            pos += buf.length
        })

        this.outBuffers = []
        this.outCount = 0

        return msg
    }

    private ensureAvailable(len: number): void {
        if (this.readCursor + len > this.buffer.length) {
            throw new InputBufferUnderrunError()
        }
    }
}
