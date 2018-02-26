import ByteBuffer = require('bytebuffer')

import { ITraceId } from './types'

function isFlagSet(flags: number, field: number): boolean {
    return (flags & field) === field
}

export const SAMPLING_KNOWN: number = (1 << 1)
export const SAMPLED: number = (1 << 2)

export function randomTraceId(): string {
    // needs to be a hex digit
    const digits: string = '0123456789abcdef'
    let traceId: string = ''

    for (let i = 0; i < 16; i++) {
        const rand = Math.floor(Math.random() * 16)
        traceId += digits[rand]
    }

    return traceId
}

function getFlagBytes(traceId: ITraceId): Uint8Array {
    if (traceId.sampled !== true) {
        return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
    } else {
        return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 6])
    }
}

/**
 * For LinkerD l5d headers the extra bits for a 128-bit trace id are appended to the
 * end of the serialized header.
 */
export function serializeLinkerdHeader(traceId: ITraceId): string {
    const serialized: ByteBuffer = ByteBuffer.concat([
        ByteBuffer.fromHex(traceId.spanId),
        ByteBuffer.fromHex(traceId.parentId),
        ByteBuffer.fromHex(traceId.traceId.substring(0, 16)),
        getFlagBytes(traceId),
        (traceId.traceIdHigh === true) ?
            ByteBuffer.fromHex(traceId.traceId.substring(16, 32)) :
            new Uint8Array([]),
    ])

    return serialized.toBase64()
}

export function deserializeLinkerdHeader(trace: string): ITraceId {
    const bytes: string = Buffer.from(trace, 'base64').toString('hex')

    if (bytes.length !== 64 && bytes.length !== 80) {
        throw new Error('TraceId headers must be 64 or 128-bit')
    } else {
        const spanId = bytes.substring(0, 16)
        const parentId = bytes.substring(16, 32)
        let traceId = bytes.substring(32, 48)
        const flags = bytes.substring(48, 64)

        const flagValue = parseInt(flags, 10)
        const sampled = isFlagSet(flagValue, SAMPLED)

        const traceIdHigh: boolean = bytes.length === 80

        if (traceIdHigh) {
            traceId += bytes.substring(64, 80)
        }

        return { spanId, parentId, traceId, sampled, traceIdHigh }
    }
}
