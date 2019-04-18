import { LogFunction } from '@creditkarma/thrift-server-core'

import {
    BatchRecorder,
    ConsoleRecorder,
    Context,
    ExplicitContext,
    JsonEncoder,
    jsonEncoder,
    Recorder,
    sampler,
    TraceId,
    Tracer,
} from 'zipkin'

import { ZipkinHeaders } from './constants'

import { HttpLogger } from 'zipkin-transport-http'

import { IZipkinTracerConfig } from './types'

class MaybeMap<K, V> extends Map<K, V> {
    public getOrElse(key: K, orElse: () => V): V {
        const value: V | undefined = this.get(key)
        if (value === undefined) {
            const newValue: V = orElse()
            this.set(key, newValue)
            return newValue
        } else {
            return value
        }
    }
}

interface IHttpLoggerOptions {
    endpoint: string
    httpInterval?: number
    httpTimeout?: number
    headers?: Record<string, any>
    jsonEncoder?: JsonEncoder
}

// Save tracers by service name
const TRACER_CACHE: MaybeMap<string, Tracer> = new MaybeMap()

/**
 * `http://localhost:9411/api/v1/spans`
 */
function recorderForOptions(options: IZipkinTracerConfig): Recorder {
    if (options.endpoint !== undefined) {
        const httpOptions: IHttpLoggerOptions = {
            endpoint: options.endpoint,
            headers: options.headers,
            httpInterval: options.httpInterval,
            httpTimeout: options.httpTimeout,
            jsonEncoder:
                options.zipkinVersion === 'v2'
                    ? jsonEncoder.JSON_V2
                    : jsonEncoder.JSON_V1,
        }

        const logger: LogFunction | undefined = options.logger
        const httpLogger: any = new HttpLogger(httpOptions)

        if (logger !== undefined) {
            httpLogger.on('error', (err: Error) => {
                logger(
                    ['error', 'zipkin'],
                    `An error occurred sending trace: ${err.message}`,
                )
            })

            httpLogger.on('success', () => {
                logger(['info', 'zipkin'], `Zipkin trace sent successfully`)
            })
        }

        return new BatchRecorder({ logger: httpLogger })
    } else {
        return new ConsoleRecorder()
    }
}

interface IHeaderMap {
    [name: string]: string
}

export function getHeadersForTraceId(traceId?: TraceId): IHeaderMap {
    if (traceId !== null && traceId !== undefined) {
        const headers: IHeaderMap = {}
        headers[ZipkinHeaders.TraceId] = traceId.traceId
        headers[ZipkinHeaders.SpanId] = traceId.spanId
        headers[ZipkinHeaders.ParentId] = traceId.parentId || ''

        traceId.sampled.ifPresent((sampled: boolean) => {
            headers[ZipkinHeaders.Sampled] = sampled ? '1' : '0'
        })

        return headers
    } else {
        return {}
    }
}

export function getTracerForService(
    serviceName: string,
    options: IZipkinTracerConfig = {},
): Tracer {
    return TRACER_CACHE.getOrElse(serviceName, () => {
        const ctxImpl: Context<TraceId> = new ExplicitContext()
        const recorder: Recorder = recorderForOptions(options)
        return new Tracer({
            ctxImpl,
            recorder,
            sampler: new sampler.CountingSampler(
                options.debug
                    ? 100
                    : options.sampleRate !== undefined
                    ? options.sampleRate
                    : 0.1,
            ),
            localServiceName: serviceName, // name of this application
        })
    })
}
