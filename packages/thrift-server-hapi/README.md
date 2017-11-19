# Thrift Server Hapi

Hapi plugin for processing Thrift requests.

## Usage

The easiest way to get started is to generate your thrift services using @creditkarma/thrift-typescript.

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

```typescript
import * as Hapi from 'hapi'
import { ThriftPlugin } from '@creditkarma/thrift-server-hapi'
import { UserService } from './codegen/user_service'

const server = new Hapi.Server({ debug: { request: [ 'error' ] } })

/**
 * Register the thrift plugin.
 *
 * This will allow us to define Hapi routes for our thrift service(s).
 * They behave like any other HTTP route handler, so you can mix and match
 * thrift / REST endpoints on the same server instance.
 */
server.register(ThriftPlugin, err => {
    if (err) {
        throw err
    }
})

/**
 * Implementation of our thrift service.
 *
 * Notice the second parameter, "context" - this is the Hapi request object,
 * passed along to our service by the Hapi thrift plugin. Thus, you have access to
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

const impl: UserService.Processor<Hapi.Request> = new UserService.Processor(handlers)

/**
 * Route to our thrift service.
 *
 * Payload parsing is disabled - the thrift plugin parses the raw request
 * using whichever protocol is configured (binary, compact, json...)
 */
server.route({
    method: 'POST',
    path: '/',
    handler: {
        thrift: {
            service: impl,
        },
    },
    config: {
        payload: {
            parse: false,
        },
    },
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