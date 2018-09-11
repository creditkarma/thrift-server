# Thrift Server Hapi

Hapi plugin for processing Thrift requests.

### Note

As of `v0.9.x` we have updated to use Hapi 17.

## Usage

Adding Thrift support to Hapi is as easy as just including the provided plugin. Because we are just including a plugin it is easy for the same server to support APIs beyond Thrift RPC, such as REST.

### Codegen

Requires @creditkarma/thrift-typescript >= v2.0.0

The easiest way to get started is to generate your Thrift services using @creditkarma/thrift-typescript.

```sh
npm install --save-dev @creditkarma/thrift-typescript
```

Add a script to your package.json to codegen. The 'target' option is important to make thrift-typescript generate for this library instead of the Apache libraries.

```json
"scripts": {
  "codegen": "thrift-typescript --target thrift-server --sourceDir thrift --outDir codegen
}
```

### Example Service

```c
service Calculator {
  i32 add(1: i32 left, 2: i32 right)
  i32 subtract(1: i32 left, 2: i32 right)
}
```

### Install

```sh
npm install --save hapi
npm install --save thrift
npm install --save @creditkarma/thrift-server-hapi
```

### Register

To get things working you need to register the Thrift plugin and define handlers for your service methods.

The `ThriftServerHapi` function creates a Hapi route at the given path on which to serve this Thrift service.

```typescript
import * as Hapi from 'hapi'
import { ThriftServerHapi } from '@creditkarma/thrift-server-hapi'
import { Calculator } from './codegen/calculator'

const PORT: number = 8080

const server = new Hapi.Server({ debug: { request: [ 'error' ] } })

server.connection({ port: PORT })

/**
 * Implementation of our Thrift service.
 *
 * Notice the second parameter, "context" - this is the Hapi request object,
 * passed along to our service by the Hapi Thrift plugin. Thus, you have access to
 * all HTTP request data from within your service implementation.
 */
const serviceHandlers: Calculator.IHandler<Hapi.Request> = {
    add(left: number, right: number, context?: express.Request): number {
        return left + right
    },
    subtract(left: number, right: number, context?: express.Request): number {
        return left - right
    },
}

const processor: Calculator.Processor<Hapi.Request> = new Calculator.Processor(serviceHandlers)

/**
 * Register the Thrift plugin.
 *
 * This plugin adds a route to your server for handling Thrift requests. The path
 * option is the path to attach the route handler to and the handler is the
 * Thrift service processor instance.
 */
server.register(ThriftServerHapi<Calculator.Processor>({
    path: '/thrift',
    thriftOptions: {
        serviceName: 'calculator-service',
        handler: processor,
    }
}).then(() => {
    /**
     * Start your hapi server
     */
    server.start((err) => {
        if (err) {
            throw err
        }
        server.log('info', `Server running on port ${port}`)
    })
})
```

#### Options

* path (required): The path on which to server your Thrift service. Defaults to '/thrift'.
* auth (optional): Authentication strategy for Thrift route as defined by [Hapi](https://hapijs.com/api/16.6.3#serverauthstrategyname-scheme-mode-options).
* thriftOptions.serviceName (required): The name of your service. Used for logging and tracing.
* thriftOptions.handler (required): The service Processor instance to handle service method calls.
* thriftOptions.transport (optional): The kind of Thrift transport to use. Only 'buffered' is currently supported.
* thriftOptions.protocol (optional): The kind of Thrift protocol to use, either 'binary' or 'compact'.

### Thrift Server Factory

In the event that you will be creating a Hapi server only to serve Thrift, you can use the `createThriftServer` factory function to create a `Hapi.Server` and register the Thrift plugin in one step.

The factory function takes all of the same configuration options as the plugin with the addition of `port`. What port do you want your server to run on?

```typescript
import * as Hapi from 'hapi'
import { createThriftServer } from '@creditkarma/thrift-server-hapi'
import { Calculator } from './codegen/calculator'

const PORT: number = 8080

async function startServer(): Promise<void> {
    const server: Hapi.Server = await createThriftServer<Calculator.Processor>({
        path: '/thrift',
        port: PORT,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: new Calculator.Processor({
                add(left: number, right: number, context?: express.Request): number {
                    return left + right
                },
                subtract(left: number, right: number, context?: express.Request): number {
                    return left - right
                },
            })
        }
    })

    /**
     * Start your hapi server
     */
    server.start((err) => {
        if (err) {
            throw err
        }
        server.log('info', `Server running on port ${port}`)
    })
}
```

### Observability

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

#### Options

* localServiceName (required): The name of your service.
* remoteServiceName (optional): The name of the service you are calling.
* debug (optional): In debug mode all requests are sampled.
* port (optional): Port number on which local server operates. This is just added to recorded metadata. Defaults to 0.
* endpoint (optional): URL of your collector (where to send traces).
* sampleRate (optional): Percentage (expressed from 0 to 1) of requests to sample. Defaults to 0.1.
* httpInterval (optional): Sampling data is batched to reduce network load. This is the rate (in milliseconds) at which to empty the sample queue by sending data to a collector. Defaults to 1000.

If the endpoint is set then the plugin will send sampling data to the given endpoint over HTTP. If the endpoint is not set then sampling data will just be logged to the console.

#### Tracing Non-Thrift Endpoints

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

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
