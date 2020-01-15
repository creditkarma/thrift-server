import { IInt64, Int64 } from '../../main'

/**
 * Test class compatible with Int64.
 */
export class LikeInt64 implements IInt64 {
    /** @inheritDoc */
    public readonly buffer: Buffer

    private readonly i64: Int64

    constructor(value: string) {
        this.i64 = Int64.fromDecimalString(value)
        this.buffer = this.i64.buffer
    }

    /** @inheritDoc */
    public toDecimalString(): string {
        return this.i64.toDecimalString()
    }
}

/**
 * Test class with no buffer.
 */
export class NoBufferInt64 implements Omit<IInt64, 'buffer'> {
    private readonly i64: Int64

    constructor(value: string) {
        this.i64 = Int64.fromDecimalString(value)
    }

    /** @inheritDoc */
    public toDecimalString(): string {
        return this.i64.toDecimalString()
    }
}

/**
 * Test class with no toDecimalString().
 */
export class NoStringInt64 implements Omit<IInt64, 'toDecimalString'> {
    /** @inheritDoc */
    public readonly buffer: Buffer

    private readonly i64: Int64

    constructor(value: string) {
        this.i64 = Int64.fromDecimalString(value)
        this.buffer = this.i64.buffer
    }
}

/**
 * Test class with a shorter buffer.
 */
export class Int56 implements IInt64 {
    /** @inheritDoc */
    public readonly buffer: Buffer

    private readonly i64: Int64

    constructor(value: string) {
        this.i64 = Int64.fromDecimalString(value)
        this.buffer = this.i64.buffer.slice(1)
    }

    /** @inheritDoc */
    public toDecimalString(): string {
        return this.i64.toDecimalString()
    }
}

/**
 * Test class with a longer buffer.
 */
export class Int72 implements IInt64 {
    /** @inheritDoc */
    public readonly buffer: Buffer

    private readonly i64: Int64

    constructor(value: string) {
        this.i64 = Int64.fromDecimalString(value)
        this.buffer = Buffer.alloc(9)
        this.i64.buffer.copy(this.buffer, 1)
    }

    /** @inheritDoc */
    public toDecimalString(): string {
        return this.i64.toDecimalString()
    }
}
