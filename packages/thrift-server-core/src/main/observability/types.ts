import {
    IRequestHeaders,
    LogFunction,
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

export type ZipkinVersion = 'v1' | 'v2'

export interface IZipkinOptions {
    localServiceName: string
    port?: number
    transport?: TransportType
    protocol?: ProtocolType
    tracerConfig?: IZipkinTracerConfig
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
    zipkinVersion?: ZipkinVersion
    logger?: LogFunction
}
