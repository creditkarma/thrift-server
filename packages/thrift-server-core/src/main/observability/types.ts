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

export type ZipkinVersion = 'v1' | 'v2'

export type EventHandler = (...args: Array<any>) => void

export interface IEventLoggers {
    [eventName: string]: EventHandler
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
    zipkinVersion?: ZipkinVersion
    eventLoggers?: IEventLoggers
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
    eventLoggers?: IEventLoggers
}
