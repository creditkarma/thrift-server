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
    IAsyncContext,
} from './AsyncContext'

import { HttpLogger } from 'zipkin-transport-http'

import {
    IZipkinTracerConfig,
} from './types'

import { IAsyncOptions } from '@creditkarma/async-scope'

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

// Save contexts by service name
const CONTEXT_CACHE: MaybeMap<string, AsyncContext> = new MaybeMap()

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

export function getContextForService(serviceName: string, options: IAsyncOptions = {}): IAsyncContext {
    return CONTEXT_CACHE.getOrElse(serviceName, () => {
        return new AsyncContext(options)
    })
}

export function getTracerForService(serviceName: string, options: IZipkinTracerConfig = {}): Tracer {
    return TRACER_CACHE.getOrElse(serviceName, () => {
        const ctxImpl: Context<TraceId> = getContextForService(serviceName, options.asyncOptions)
        const recorder: Recorder = recorderForOptions(options)
        return new Tracer({
            ctxImpl,
            recorder,
            sampler: new sampler.CountingSampler(
                (options.sampleRate !== undefined) ?
                    options.sampleRate :
                    0.1,
            ),
            localServiceName: serviceName, // name of this application
        })
    })
}
