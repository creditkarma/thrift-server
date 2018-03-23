import {
    BatchRecorder,
    ConsoleRecorder,
    Context,
    Recorder,
    sampler,
    TraceId,
    Tracer,
} from 'zipkin'

import {
    ZipkinHeaders,
} from './constants'

import {
    AsyncContext,
} from './AsyncContext'

import { HttpLogger } from 'zipkin-transport-http'

import {
    IZipkinTracerConfig,
} from './types'

import {
    AsyncScope,
} from '@creditkarma/async-scope'

export const asyncScope: AsyncScope = new AsyncScope()

class MaybeMap<K,V> extends Map<K,V> {
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

const TRACER_CACHE: MaybeMap<string, Tracer> = new MaybeMap()

/**
 * `http://localhost:9411/api/v1/spans`
 */

function recorderForOptions(options: IZipkinTracerConfig): Recorder {
    if (options.endpoint !== undefined) {
        return new BatchRecorder({
            logger: new HttpLogger({
                endpoint: options.endpoint,
                httpInterval: options.httpInterval,
            }),
        })

    } else {
        return new ConsoleRecorder()
    }
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
        const ctxImpl: Context<TraceId> = new AsyncContext()
        const recorder: Recorder = recorderForOptions(options)

        const tracer = new Tracer({
            ctxImpl,
            recorder,
            sampler: new sampler.CountingSampler(
                (options.sampleRate !== undefined) ?
                    options.sampleRate :
                    0.1,
            ),
            localServiceName: serviceName, // name of this application
        })

        return tracer
    })
}
