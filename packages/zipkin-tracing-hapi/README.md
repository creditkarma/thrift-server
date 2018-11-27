# Zipkin Tracing Hapi

One of the problems that arise in microservice architectures is tracing the life of a request. Where do errors occur? Where are latencies? Just understanding all of the services a request touches can be non-trivial in complex systems.

This plugin for [@creditkarma/thrift-server-hapi](https://github.com/creditkarma/thrift-server/tree/master/packages/thrift-server-hapi) helps to solve this problem by adding support for distributed tracing with [Zipkin](https://github.com/openzipkin/zipkin-js).

## Usage

Distributed tracing is provided out-of-the-box with [Zipkin](https://github.com/openzipkin/zipkin-js). Distributed tracing allows you to track a request across multiple service calls to see where latency is in your system or to see where a particular request is failing. Also, just to get a complete picture of how many services a request of a particular kind touch.

Zipkin tracing is added to your Hapi server with a plugin.

```typescript
import * as hapi from 'hapi'

import {
    createThriftServer,
    ZipkinTracingHapi,
} from '@creditkarma/thrift-server-hapi'

import { Calculator } from './codegen/calculator'

const PORT = 8080
const HOSTNAME = 'localhost'
const SERVICE_NAME = 'calculator-service'

async function startServer(): Promise<void> {
    const server: Hapi.Server = await createThriftServer({
        port: PORT,
        path: HOSTNAME,
        thriftOptions: {
            serviceName: SERVICE_NAME,
            handler: new Calculator.Processor({
                add(left: number, right: number, context?: express.Request): number {
                    return left + right
                },
                subtract(left: number, right: number, context?: express.Request): number {
                    return left - right
                },
            })
        },
    })

    await server.register({
        plugin: ZipkinTracingHapi({
            localServiceName: SERVICE_NAME,
            endpoint: 'http://localhost:9411/api/v1/spans',
            sampleRate: 0.1
        }),
    })

    server.start()
}
```

In order for tracing to be useful other services in your system will also need to be setup with Zipkin tracing. Plugins are available for `thrift-server-express` and `thrift-client`. The provided plugins in Thrift Server only support HTTP transport at the moment.

### Options

* localServiceName (required): The name of your service.
* remoteServiceName (optional): The name of the service you are calling.
* port (optional): Port number on which local server operates. This is just added to recorded metadata. Defaults to 0.
* tracerConfig.debug (optional): In debug mode all requests are sampled.
* tracerConfig.endpoint (optional): URL of your collector (where to send traces).
* tracerConfig.sampleRate (optional): Percentage (expressed from 0 to 1) of requests to sample. Defaults to 0.1.
* tracerConfig.httpInterval (optional): Sampling data is batched to reduce network load. This is the rate (in milliseconds) at which to empty the sample queue by sending data to a collector. Defaults to 1000.

If the endpoint is set then the plugin will send sampling data to the given endpoint over HTTP. If the endpoint is not set then sampling data will just be logged to the console.

### Tracing Non-Thrift Endpoints

Sometimes, as part of completing your service request, you may need to gather data from both Thrift and non-Thrift endpoints. To get a complete picture you need to trace all of these calls. You can add Zipkin to other requests with instrumentation provided by the [OpenZipkin](https://github.com/openzipkin/zipkin-js) project.

When constructing instrumentation provided by another library you need to use the same `Tracer` in order to maintain the correct trace context. You can import this shared `Tracer` through a call to `getTracerForService`. This assumes a `Tracer` has already been created for your service by usage of one of the Thrift Zipkin plugins.

```typescript
import { getTracerForService } from '@creditkarma/thrift-server-core'
import * as wrapRequest from 'zipkin-instrumentation-request'
import * as request from 'request'

const tracer = getTracerForService('calculator-client')
const zipkinRequest = wrapRequest(request, { tracer, remoteServiceName: 'calculator-service' })
zipkinRequest.get(url, (err, resp, body) => {
    // Do something
})
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
