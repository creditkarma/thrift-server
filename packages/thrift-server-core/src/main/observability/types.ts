import { IRequestHeaders, ProtocolType, TransportType } from '../types'

export type ErrorLogFunc = (err: Error) => void

export type SuccessLogFunc<T extends { status: number }> = (res: T) => void

export interface IEventLoggers<T extends { status: number } = { status: number}> {
    error?: ErrorLogFunc
    success?: SuccessLogFunc<T>
}

export interface ITraceId {
    spanId: string
    parentId: string
    traceId: string
    sampled?: boolean
    traceIdHigh?: boolean
}

export interface IZipkinPluginOptions {
    localServiceName: string
    remoteServiceName?: string
    port?: number
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
    httpTimeout?: number
    headers?: IRequestHeaders
    transport?: TransportType
    protocol?: ProtocolType
    eventLoggers?: IEventLoggers
}

export interface IZipkinTracerConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
    httpTimeout?: number
    headers?: IRequestHeaders
    eventLoggers?: IEventLoggers
}
