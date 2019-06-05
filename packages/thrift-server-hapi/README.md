# Thrift Server Hapi

Hapi plugin for processing Thrift requests.

### Note

As of `v0.9.x` we have updated to use Hapi 17.

## Usage

Adding Thrift support to Hapi is as easy as just including the provided plugin. Because we are just including a plugin it is easy for the same server to support APIs beyond Thrift RPC, such as REST.

### Codegen

Requires @creditkarma/thrift-typescript >= v3.0.0

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
import * as Hapi from '@hapi/hapi'
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
import * as Hapi from '@hapi/hapi'
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

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
