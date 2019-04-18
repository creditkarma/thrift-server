import {
    getProtocol,
    getTransport,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import {
    getTracerForService,
    headersForTraceId,
    IZipkinOptions,
    normalizeHeaders,
} from '@creditkarma/zipkin-core'

import { Instrumentation, option, TraceId, Tracer } from 'zipkin'

import * as express from 'express'
import * as url from 'url'

function formatRequestUrl(req: express.Request): string {
    const parsed = url.parse(req.originalUrl)
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: parsed.pathname || '/',
        search: parsed.search,
    })
}

export function ZipkinTracingExpress({
    localServiceName,
    port = 0,
    isThrift = true,
    transport = 'buffered',
    protocol = 'binary',
    tracerConfig = {},
}: IZipkinOptions): express.RequestHandler {
    const tracer: Tracer = getTracerForService(localServiceName, tracerConfig)
    const instrumentation = new Instrumentation.HttpServer({ tracer, port })

    return (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction,
    ): void => {
        tracer.scoped(() => {
            const requestMethod: string =
                isThrift === true
                    ? readThriftMethod(
                          request.body,
                          getTransport(transport),
                          getProtocol(protocol),
                      )
                    : request.method

            const normalHeaders: Record<string, any> = normalizeHeaders(
                request.headers,
            )

            function readHeader<T>(header: string): option.IOption<T> {
                const val = normalHeaders[header.toLocaleLowerCase()]
                if (val !== null && val !== undefined) {
                    return new option.Some(val)
                } else {
                    return option.None
                }
            }

            const traceId: TraceId = instrumentation.recordRequest(
                requestMethod,
                formatRequestUrl(request),
                readHeader,
            )

            const traceHeaders: Record<string, any> = headersForTraceId(traceId)

            // Update headers on request object
            for (const key in traceHeaders) {
                if (traceHeaders.hasOwnProperty(key)) {
                    request.headers[key] = traceHeaders[key]
                }
            }

            response.on('finish', () => {
                tracer.scoped(() => {
                    instrumentation.recordResponse(
                        traceId as any,
                        `${response.statusCode}`,
                    )
                })
            })

            next()
        })
    }
}
