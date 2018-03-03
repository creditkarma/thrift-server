// import { Tracer, Instrumentation } from 'zipkin'
import {
    // getTracerForService
} from '@creditkarma/thrift-server-core'
import { CoreOptions } from 'request'

import {
    IRequestMiddleware,
    IThriftContext,
} from '../types'

export interface IZipkinPluginOptions {
    serviceName: string
    port?: number
    debug?: boolean
    endpoint?: string
    sampleRate?: number
}

export function ZipkinTracePlugin({
    serviceName,
    port = 0,
    debug = false,
    endpoint,
    sampleRate,
}: IZipkinPluginOptions): IRequestMiddleware<CoreOptions> {
    return {
        type: 'request',
        methods: [],
        handler(context: IThriftContext<CoreOptions>): Promise<CoreOptions> {
            console.log('context: ', context)
            // const tracer: Tracer = getTracerForService(serviceName, { debug, endpoint, sampleRate })
            // const instrumentation = new Instrumentation.HttpClient({ tracer, remoteServiceName: serviceName })
            // if (context.headers !== undefined) {

            // }

            return Promise.resolve(context.options || {})
        },
    }
}

/**
 *
const {
    Instrumentation
} = require('zipkin');

function wrapFetch(fetch, { tracer, serviceName, remoteServiceName }) {
    const instrumentation =
        new Instrumentation.HttpClient({
            tracer,
            serviceName,
            remoteServiceName
        });

    return function zipkinfetch(url, opts = {}) {
        return new Promise((resolve, reject) => {
            tracer.scoped(() => {
                const method = opts.method || 'GET';
                const zipkinOpts = instrumentation.recordRequest(opts, url, method);
                const traceId = tracer.id;

                fetch(url, zipkinOpts).then(res => {
                    tracer.scoped(() => {
                        instrumentation.recordResponse(traceId, res.status);
                    });
                    resolve(res);

                }).catch(err => {
                    tracer.scoped(() => {
                        instrumentation.recordError(traceId, err);
                    });
                    reject(err);
                });
            });
        });
    };
}

module.exports = wrapFetch;

*/
