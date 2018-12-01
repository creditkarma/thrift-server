import ByteBuffer = require('bytebuffer')
import { option, TraceId } from 'zipkin'

import { ITraceId } from './types'

import { L5D_TRACE_HDR, ZipkinHeaders } from './constants'

import { IRequestHeaders } from '@creditkarma/thrift-server-core'

function isFlagSet(flags: number, field: number): boolean {
    return (flags & field) === field
}

export const SAMPLING_KNOWN: number = 1 << 1
export const SAMPLED: number = 1 << 2

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

function getFlagBytes(traceId: TraceId): Uint8Array {
    const value = traceId.sampled.getOrElse(false)
    if (value !== true) {
        return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
    } else {
        return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 6])
    }
}

function is128bit(traceId: TraceId): boolean {
    return traceId.traceId.length === 32
}

/**
 * For LinkerD l5d headers the extra bits for a 128-bit trace id are appended to the
 * end of the serialized header.
 */
export function serializeLinkerdHeader(traceId: TraceId): string {
    const serialized: ByteBuffer = ByteBuffer.concat([
        ByteBuffer.fromHex(traceId.spanId),
        ByteBuffer.fromHex(traceId.parentId),
        ByteBuffer.fromHex(traceId.traceId.substring(0, 16)),
        getFlagBytes(traceId),
        is128bit(traceId)
            ? ByteBuffer.fromHex(traceId.traceId.substring(16, 32))
            : new Uint8Array([]),
    ])

    return serialized.toBase64()
}

export function deserializeLinkerdHeader(trace: string): TraceId {
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

        return traceIdFromTraceId({
            spanId,
            parentId,
            traceId,
            sampled,
            traceIdHigh,
        })
    }
}

function fromNullable<T>(nullable: any): option.IOption<T> {
    if (nullable !== null && nullable !== undefined) {
        return new option.Some(nullable)
    } else {
        return option.None
    }
}

export function traceIdValues(traceId: TraceId): ITraceId {
    return {
        traceId: traceId.traceId,
        spanId: traceId.spanId,
        parentId: traceId.parentId,
        sampled: traceId.sampled.getOrElse(false),
        traceIdHigh: traceId.traceId.length > 16,
    }
}

export function traceIdFromTraceId(trace: ITraceId): TraceId {
    return new TraceId({
        traceId: fromNullable(trace.traceId),
        parentId: fromNullable(trace.parentId),
        spanId: trace.spanId,
        sampled: fromNullable(trace.sampled),
    })
}

export function headersForTraceId(traceId: TraceId): IRequestHeaders {
    return {
        [ZipkinHeaders.TraceId]: traceId.traceId,
        [ZipkinHeaders.SpanId]: traceId.spanId,
        [ZipkinHeaders.ParentId]: traceId.parentId,
        [ZipkinHeaders.Sampled]: traceId.sampled.getOrElse(false) ? '1' : '0',
    }
}

export function containsZipkinHeaders(headers: IRequestHeaders): boolean {
    return (
        headers[L5D_TRACE_HDR] !== undefined ||
        (headers[ZipkinHeaders.TraceId] !== undefined &&
            headers[ZipkinHeaders.SpanId] !== undefined)
    )
}

export function traceIdForHeaders(headers: IRequestHeaders): ITraceId {
    const normalizedHeaders = normalizeHeaders(headers)
    const traceId: string = normalizedHeaders[ZipkinHeaders.TraceId] as string
    const spanId: string = normalizedHeaders[ZipkinHeaders.SpanId] as string
    const parentId: string = normalizedHeaders[ZipkinHeaders.ParentId] as string
    const sampled: string = normalizedHeaders[ZipkinHeaders.Sampled] as string
    return {
        traceId,
        spanId,
        parentId,
        sampled: sampled === '1' ? true : false,
    }
}

export function normalizeHeaders(headers: IRequestHeaders): IRequestHeaders {
    if (headers[L5D_TRACE_HDR] !== undefined) {
        const linkerDTrace = deserializeLinkerdHeader(headers[
            L5D_TRACE_HDR
        ] as string)
        if (
            headers[ZipkinHeaders.TraceId] !== undefined &&
            headers[ZipkinHeaders.TraceId] !== linkerDTrace.traceId
        ) {
            return headers
        } else {
            headers[ZipkinHeaders.TraceId] = linkerDTrace.traceId
            headers[ZipkinHeaders.SpanId] = linkerDTrace.spanId
            headers[ZipkinHeaders.ParentId] = linkerDTrace.parentId
            headers[ZipkinHeaders.Sampled] = linkerDTrace.sampled ? '1' : '0'
            return headers
        }
    } else {
        return headers
    }
}

export function hasL5DHeader(headers: IRequestHeaders): boolean {
    return headers[L5D_TRACE_HDR] !== undefined
}

export function addL5Dheaders(headers: IRequestHeaders): IRequestHeaders {
    const newHeaders = Object.keys(headers).reduce((acc: any, next: string) => {
        acc[next.toLowerCase()] = headers[next]
        return acc
    }, {})

    newHeaders[L5D_TRACE_HDR] = serializeLinkerdHeader(
        traceIdFromTraceId({
            traceId: newHeaders[ZipkinHeaders.TraceId] as string,
            spanId: newHeaders[ZipkinHeaders.SpanId] as string,
            parentId: newHeaders[ZipkinHeaders.ParentId] as string,
            sampled: newHeaders[ZipkinHeaders.Sampled] === '1' ? true : false,
        }),
    )

    return newHeaders
}
