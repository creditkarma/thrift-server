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

import {
    ZipkinHeaders,
} from './constants'

import { HttpLogger } from 'zipkin-transport-http'

import {
    IZipkinTracerConfig,
} from './types'

const TRACER_CACHE: Map<string, Tracer> = new Map()

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

export function getTracerForService(serviceName: string, options: IZipkinTracerConfig): Tracer {
    const maybeTracer = TRACER_CACHE.get(serviceName)

    if (maybeTracer !== undefined) {
        return maybeTracer

    } else {
        const ctxImpl: Context<TraceId> = new ExplicitContext()
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

        TRACER_CACHE.set(serviceName, tracer)

        return tracer
    }
}
