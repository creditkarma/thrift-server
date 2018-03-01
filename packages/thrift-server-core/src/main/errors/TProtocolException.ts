export enum TProtocolExceptionType {
    UNKNOWN = 0,
    INVALID_DATA = 1,
    NEGATIVE_SIZE = 2,
    SIZE_LIMIT = 3,
    BAD_VERSION = 4,
    NOT_IMPLEMENTED = 5,
    DEPTH_LIMIT = 6,
}

export class TProtocolException extends Error {
    public readonly name: string = 'TProtocolException'
    public readonly type: TProtocolExceptionType

    constructor(type: TProtocolExceptionType, message?: string) {
        super(message)
        this.type = type
    }
}
