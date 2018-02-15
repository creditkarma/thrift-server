import { TProtocol } from '../protocols'
import { IStructCodec, IThriftField, TType } from '../types'

export enum TApplicationExceptionType {
    UNKNOWN = 0,
    UNKNOWN_METHOD = 1,
    INVALID_MESSAGE_TYPE = 2,
    WRONG_METHOD_NAME = 3,
    BAD_SEQUENCE_ID = 4,
    MISSING_RESULT = 5,
    INTERNAL_ERROR = 6,
    PROTOCOL_ERROR = 7,
    INVALID_TRANSFORM = 8,
    INVALID_PROTOCOL = 9,
    UNSUPPORTED_CLIENT_TYPE = 10,
}

export class TApplicationException extends Error {
    public readonly name: string = 'TApplicationException'
    public type: TApplicationExceptionType
    public message: string

    constructor(type: TApplicationExceptionType, message: string) {
        super(message)
        this.type = type
        this.message = message
    }
}

export const TApplicationExceptionCodec: IStructCodec<TApplicationException> = {
    encode(obj: TApplicationException, output: TProtocol): void {
        output.writeStructBegin('TApplicationException')

        if (obj.message) {
            output.writeFieldBegin('message', TType.STRING, 1)
            output.writeString(obj.message)
            output.writeFieldEnd()
        }

        if (obj.type) {
            output.writeFieldBegin('type', TType.I32, 2)
            output.writeI32(obj.type)
            output.writeFieldEnd()
        }

        output.writeFieldStop()
        output.writeStructEnd()
    },
    decode(input: TProtocol): TApplicationException {
        input.readStructBegin()
        const args: any = {}

        while (true) {
            const ret: IThriftField = input.readFieldBegin()
            if (ret.fieldType === TType.STOP) {
                break
            }

            switch (ret.fieldId) {
                case 1:
                    if (ret.fieldType === TType.STRING) {
                        args.message = input.readString()
                    } else {
                        input.skip(ret.fieldType)
                    }

                    break

                case 2:
                    if (ret.fieldType === TType.I32) {
                        args.type = input.readI32()
                    } else {
                        input.skip(ret.fieldType)
                    }
                    break

                default:
                    input.skip(ret.fieldType)
                    break
            }

            input.readFieldEnd()
        }

        input.readStructEnd()

        return new TApplicationException(args.type, args.message)
    },
}
