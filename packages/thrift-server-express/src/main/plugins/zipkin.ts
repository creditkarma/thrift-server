import {
    getTracerForService,
    IZipkinPluginOptions,
} from '@creditkarma/thrift-server-core'

import {
    Instrumentation,
    option,
    TraceId,
    Tracer,
} from 'zipkin'

import * as express from 'express'
import * as url from 'url'

function formatRequestUrl(req: express.Request): string {
    const parsed = url.parse(req.originalUrl)
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: parsed.pathname,
        search: parsed.search,
    })
}

export function zipkinMiddleware({
    serviceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
}: IZipkinPluginOptions): express.RequestHandler {
    const tracer: Tracer = getTracerForService(serviceName, { debug, endpoint, sampleRate })
    const instrumentation = new Instrumentation.HttpServer({ tracer, port })
    return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
        console.log('zipkin request express')
        tracer.scoped(() => {
            function readHeader(header: string): option.IOption<string> {
                const val = req.header(header)
                console.log('val: ', val)
                if (val != null) {
                    return new option.Some(val)
                } else {
                    return option.None
                }
            }

            const traceId: TraceId =
                instrumentation.recordRequest(
                    req.method,
                    formatRequestUrl(req),
                    (readHeader as any),
                ) as any as TraceId // Nasty but this method is incorectly typed

            (req as any)._traceId = traceId

            res.on('finish', () => {
                tracer.scoped(() => {
                    instrumentation.recordResponse(
                        (traceId as any as TraceId),
                        `${res.statusCode}`,
                    )
                })
            })

            next()
        })
    }
}
