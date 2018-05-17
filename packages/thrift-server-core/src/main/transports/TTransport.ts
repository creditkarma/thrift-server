export abstract class TTransport {
    public static receiver(data: Buffer): TTransport {
        throw new Error('Not implemented')
    }

    protected buffer: Buffer
    protected requestId: number | null

    constructor(buffer: Buffer) {
        this.buffer = buffer
        this.requestId = null
    }

    // Return any bytes remaining to be read
    public abstract remaining(): Buffer

    public abstract rollbackPosition(): void
    // public abstract getBytesRemaining(): number
    // public abstract getBufferPosition(): number
    public abstract consume(len: number): void

    // public abstract getBuffer(): Buffer
    public abstract isOpen(): boolean
    public abstract open(): boolean
    public abstract close(): boolean

    public abstract read(len: number): Buffer
    public abstract readByte(): number
    public abstract readI16(): number
    public abstract readI32(): number
    public abstract readDouble(): number
    public abstract readString(len: number): string

    /**
     * Writes buffer to the output
     */
    public abstract write(buf: Buffer): void

    /**
     * Flush any pending data out of a transport buffer
     */
    public abstract flush(): Buffer
}
