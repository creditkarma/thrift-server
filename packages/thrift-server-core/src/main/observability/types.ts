import { IAsyncOptions } from '@creditkarma/async-scope'

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
    headers: { [key: string]: string }
    httpInterval?: number
    asyncOptions?: IAsyncOptions
}

export interface IZipkinTracerConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    headers: { [key: string]: string }
    httpInterval?: number
    asyncOptions?: IAsyncOptions
}
