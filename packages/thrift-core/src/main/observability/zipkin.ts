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

const TRACER_CACHE: Map<string, Tracer> = new Map()

/**
 * `http://localhost:9411/api/v1/spans`
 */

export interface IZipkinConfig {
    debug?: boolean
    endpoint?: string
    sampleRate?: number
}

function recorderForOptions(options: IZipkinConfig): Recorder {
    if (options.endpoint !== undefined) {
        return new BatchRecorder({
            logger: new HttpLogger({
                endpoint: options.endpoint,
            }),
        })
    } else {
        return new ConsoleRecorder()
    }
}

export function getTracerForService(name: string, options: IZipkinConfig): Tracer {
    const maybeTracer = TRACER_CACHE.get(name)

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
            localServiceName: name, // name of this application
        })

        TRACER_CACHE.set(name, tracer)

        return tracer
    }
}
