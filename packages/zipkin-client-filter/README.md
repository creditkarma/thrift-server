# Zipkin Client Filter

One of the problems that arise in microservice architectures is tracing the life of a request. Where do errors occur? Where are latencies? Just understanding all of the services a request touches can be non-trivial in complex systems.

This filter for [@creditkarma/thrift-client](https://github.com/creditkarma/thrift-server/tree/master/packages/thrift-client) helps to solve this problem by adding support for distributed tracing with [Zipkin](https://github.com/openzipkin/zipkin-js).

## Installation

`ZipkinClientFilter` has a few `peerDependencies`.

```sh
npm install --save @creditkarma/thrift-server-core
npm install --save @creditkarma/thrift-client
npm install --save @creditkarma/thrift-zipkin-core
npm install --save @creditkarma/zipkin-client-filter
```

## Usage

Zipkin tracing is added to your Thrift client through filters.

```typescript
import {
    createHttpClient,
} from '@creditkaram/thrift-client'

import {
    ZipkinClientFilter,
} from '@creditkarma/zipkin-client-filter'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client<ThriftContext<CoreOptions>> =
    createHttpClient(Calculator.Client, {
        hostName: 'localhost',
        port: 8080,
        register: [ ZipkinClientFilter({
            localServiceName: 'calculator-client',
            remoteServiceName: 'calculator-service',
            tracerConfig: {
                endpoint: 'http://localhost:9411/api/v1/spans',
                sampleRate: 0.1,
            }
        }) ]
    })
```

In order for tracing to be useful the services you are communicating with will also need to be setup with Zipkin tracing. Plugins are available for `thrift-server-hapi` and `thrift-server-express`. The provided plugins in Thrift Server only support HTTP transport at the moment.

### Options

* localServiceName (required): The name of your service.
* remoteServiceName (optional): The name of the service you are calling.
* tracerConfig.debug (optional): In debug mode all requests are sampled.
* tracerConfig.endpoint (optional): URL of your collector (where to send traces).
* tracerConfig.sampleRate (optional): Percentage (from 0 to 1) of requests to sample. Defaults to 0.1.
* tracerConfig.httpInterval (optional): Sampling data is batched to reduce network load. This is the rate (in milliseconds) at which to empty the sample queue. Defaults to 1000.

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
