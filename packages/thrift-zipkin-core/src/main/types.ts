import {
    IRequestHeaders,
    LogFunction,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

export { ITraceId } from '@creditkarma/thrift-server-core'

export type ZipkinVersion = 'v1' | 'v2'

export interface IZipkinOptions {
    localServiceName: string
    port?: number
    isThrift?: boolean
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
