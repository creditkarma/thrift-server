# Thrift Server Hapi

Hapi plugin for processing Thrift requests.

## Usage

Requires @creditkarma/thrift-typescript >= v1.0.0

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

To get things working you need to register the ThriftPlugin and define handlers for your service methods.

The `ThriftPlugin` create a Hapi route at the given path on which to serve this Thrift service.

```typescript
import * as Hapi from 'hapi'
import { ThriftPlugin } from '@creditkarma/thrift-server-hapi'
import { UserService } from './codegen/user_service'

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
const handlers: UserService.IHandler<Hapi.Request> = {
    getUser(request: RecommendationsRequest, context?: Hapi.Request) {
        const userId = request.userId

        if (userId.toNumber() <= 0) {
            throw new Error('User ID must be greater than zero')
        }

        return getUserForId(userId)
    },
}

const processor: UserService.Processor<Hapi.Request> = new UserService.Processor(handlers)

/**
 * Register the Thrift plugin.
 *
 * This will allow us to define Hapi routes for our Thrift service(s).
 * They behave like any other HTTP route handler, so you can mix and match
 * Thrift / REST endpoints on the same server instance.
 *
 * This plugin adds a route to your server for handling Thrift requests. The path
 * option is the path to attache the route handler to and the handler is the
 * Thrift service processor instance.
 */
server.register(ThriftPlugin<UserService.Processor>({
    serviceName: 'user-service',
    path: '/thrift',
    handler: processor,
}), err => {
    if (err) {
        throw err
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
```

#### Options

* serviceName - The name of your service. Used for logging and tracing.
* handler - The service Processor instance to handle service method calls.
* path - The path on which to server your Thrift service. Defaults to '/thrift'.
* transport - The kind of Thrift transport to use. Only 'buffered' is currently supported.
* protocol - The kind of Thrift protocol to use. Only 'binary' is currently supported.

### Thrift Server Factory

In the event that you will be creating a Hapi server only to serve Thrift, you can use the `createThriftServer` factory function to create a `Hapi.Server` and register the `ThriftPlugin` in one step.

The factory function takes all of the same configuration options as the plugin with the addition of `port`. What port do you want your server to run on?

```typescript
import * as Hapi from 'hapi'
import { createThriftServer } from '@creditkarma/thrift-server-hapi'
import { UserService } from './codegen/user_service'

const PORT: number = 8080

const server: Hapi.Server = createThriftServer<UserService.Processor>({
    serviceName: 'user-service',
    path: '/thrift',
    port: PORT,
    handler: new UserService.Processor({
        getUser(request: RecommendationsRequest, context?: Hapi.Request) {
            const userId = request.userId

            if (userId.toNumber() <= 0) {
                throw new Error('User ID must be greater than zero')
            }

            return getUserForId(userId)
        },
    })
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
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)