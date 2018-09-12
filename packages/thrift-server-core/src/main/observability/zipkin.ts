import {
    BatchRecorder,
    ConsoleRecorder,
    Context,
    ExplicitContext,
    Recorder,
    sampler,
    TraceId,
    Tracer,
} from 'zipkin'

import { HttpLogger } from 'zipkin-transport-http'

import { IRequestHeaders } from '../types'

import { ZipkinHeaders } from './constants'

import {
    ErrorLogFunc,
    IZipkinTracerConfig,
} from './types'

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

// Save tracers by service name
const TRACER_CACHE: MaybeMap<string, Tracer> = new MaybeMap()

/**
 * `http://localhost:9411/api/v1/spans`
 */

type HttpLoggerOptions = {
    endpoint: string
    httpInterval?: number
    httpTimeout?: number,
} & {
    headers?: IRequestHeaders,
}

function recorderForOptions(options: IZipkinTracerConfig): Recorder {
    if (options.endpoint !== undefined) {
        const httpOptions: HttpLoggerOptions = {
            endpoint: options.endpoint,
            httpInterval: options.httpInterval,
            httpTimeout: options.httpTimeout,
            headers: options.headers,
        }

        const logger: any = new HttpLogger(httpOptions)

        if (typeof options.logger === 'function' && typeof logger.on === 'function') {
            logger.on('error', options.logger)
        }

        return new BatchRecorder({ logger })

    } else {
        return new ConsoleRecorder()
    }
}

export const defaultErrorLogger: ErrorLogFunc = (err: Error): void => {
    console.error(err.message)
}

export function getHeadersForTraceId(traceId?: TraceId): { [name: string]: any } {
    if (traceId !== null && traceId !== undefined) {
        const headers: { [name: string]: any } = {}
        headers[ZipkinHeaders.TraceId] = traceId.traceId
        headers[ZipkinHeaders.SpanId] = traceId.spanId

        traceId._parentId.ifPresent((val: string) => {
            headers[ZipkinHeaders.ParentId] = val
        })

        traceId.sampled.ifPresent((sampled: boolean) => {
            headers[ZipkinHeaders.Sampled] = sampled ? '1' : '0'
        })

        return headers
    } else {
        return {}
    }
}

export function getTracerForService(serviceName: string, options: IZipkinTracerConfig = {}): Tracer {
    return TRACER_CACHE.getOrElse(serviceName, () => {
        const ctxImpl: Context<TraceId> = new ExplicitContext()
        const recorder: Recorder = recorderForOptions(options)
        return new Tracer({
            ctxImpl,
            recorder,
            sampler: new sampler.CountingSampler(
                (options.debug) ?
                    100 :
                    (options.sampleRate !== undefined) ?
                        options.sampleRate :
                        0.1,
            ),
            localServiceName: serviceName, // name of this application
        })
    })
}
