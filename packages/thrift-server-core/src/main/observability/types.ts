export interface ITraceId {
    spanId: string
    parentId: string
    traceId: string
    sampled?: boolean
    traceIdHigh?: boolean
}

export interface IRequestHeaders {
    [name: string]: string | Array<string> | undefined
}

export interface IZipkinPluginOptions {
    localServiceName: string
    remoteServiceName?: string
    port?: number
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
}

export interface IZipkinTracerConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
    httpInterval?: number
}
