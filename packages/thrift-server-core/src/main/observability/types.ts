import {
    IRequestHeaders,
    ProtocolType,
    TransportType,
} from '../types'

export interface ITraceId {
    spanId: string
    parentId: string
    traceId: string
    sampled?: boolean
    traceIdHigh?: boolean
}

export interface IZipkinOptions {
    localServiceName: string
    port?: number
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    headers?: IRequestHeaders
    httpInterval?: number
    httpTimeout?: number
    transport?: TransportType
    protocol?: ProtocolType
}

export interface IZipkinClientOptions extends IZipkinOptions {
    remoteServiceName?: string
}

export interface IZipkinTracerConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    headers?: IRequestHeaders
    httpInterval?: number
    httpTimeout?: number
}
