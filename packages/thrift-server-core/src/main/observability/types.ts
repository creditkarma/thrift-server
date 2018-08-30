import { IRequestHeaders, ProtocolType, TransportType } from '../types'

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
}

export interface IZipkinTracerConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
    httpTimeout?: number
    headers?: IRequestHeaders
}
