import * as binary from '../binary'

const MAX_PACKETS: number = 10

export class ThriftFrameCodec {
    public encode(dateToSend: Buffer): Buffer {
        const msg = Buffer.alloc(dateToSend.length + 4)
        binary.writeI32(msg, dateToSend.length)
        dateToSend.copy(msg, 4, 0, dateToSend.length)

        return msg
    }

    public decode(dataToRead: Buffer): Buffer {
        const dataToReturn: Buffer = Buffer.alloc((dataToRead.length - 4))
        let writeCursor: number = 0
        let count: number = 0

        while (dataToRead.length > 0) {
            // We don't have enough to read frame size, something is wrong
            if (dataToRead.length < 4) {
                return Buffer.alloc(0)

            } else {
                const frameSize: number = binary.readI32(dataToRead, 0)
                if (dataToRead.length < 4 + frameSize) {
                    return Buffer.alloc(0)
                }

                const frame: Buffer = dataToRead.slice(4, 4 + frameSize)
                const remaining: Buffer = dataToRead.slice(4 + frameSize)

                frame.copy(dataToReturn, 0, writeCursor)
                writeCursor += frame.length

                dataToRead = remaining
                count++

                if (count >= MAX_PACKETS) {
                    dataToRead = Buffer.alloc(0)
                }
            }
        }

        return dataToReturn
    }
}
