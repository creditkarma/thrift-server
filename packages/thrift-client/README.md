# Thrift Client

Thrift client library for NodeJS written in TypeScript.

Supports communicating with Thrift services over HTTP or TCP.

## Usage

We're going to go through this step-by-step.

* Install dependencies
* Define our service
* Run codegen on our Thrift IDL
* Create a client
* Make service calls with our client

### Install

All Thrift Server libraries define inter-dependencies as peer dependencies to avoid type collisions.

```sh
$ npm install --save-dev @creditkarma/thrift-typescript
$ npm install --save @creditkarma/thrift-server-core
$ npm install --save @creditkarma/thrift-client
$ npm install --save request
$ npm install --save @types/request
```

### Example Service

```c
service Calculator {
  i32 add(1: i32 left, 2: i32 right)
  i32 subtract(1: i32 left, 2: i32 right)
}
```

### Codegen

Requires @creditkarma/thrift-typescript >= v3.0.0

Add a script to your package.json to codegen. The 'target' option is important to make thrift-typescript generate for this library instead of the Apache libraries.

```json
"scripts": {
  "codegen": "thrift-typescript --target thrift-server --sourceDir thrift --outDir codegen"
}
```

Then you can run codegen:

```sh
$ npm run codegen
```

### Creating an HTTP Client

There are two ways to create HTTP clients with the public API.

* Use the `createHttpClient` factory function.
* Manually create your own `HttpConnection` object

#### `createHttpClient`

Using the `createHttpClient` function you pass in two arguments, the first is your Thrift service client class and the second is a map of options to configure the underlying HTTP connection.

When creating a client using this method Thrift Client uses the [Request library](https://github.com/request/request) for making HTTP requests.

```typescript
import {
    createHttpClient
} from '@creditkarma/thrift-client'

import { CoreOptions } from 'request'

import { Calculator } from './codegen/calculator'

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createHttpClient(Calculator.Client, {
    serviceName: 'calculator-service',
    hostName: 'localhost',
    port: 8080,
    requestOptions: {} // CoreOptions to pass to Request
})
```

##### Options

The available options are:

* serviceName (optional): The name of your service. Used for logging.
* hostName (required): The name of the host to connect to.
* port (required): The port number to attach to on the host.
* path (optional): The path on which the Thrift service is listening. Defaults to '/thrift'.
* https (optional): Boolean value indicating whether to use https. Defaults to false.
* transport (optional): Name of the Thrift transport type to use. Defaults to 'buffered'.
* protocol (optional): Name of the Thrift protocol type to use. Defaults to 'binary'.
* requestOptions (optional): Options to pass to the underlying [Request library](https://github.com/request/request#requestoptions-callback). Defaults to {}.
* register (optional): A list of filters to apply to your client. More on this later.

Currently `@creditkarma/thrift-server-core"` only supports buffered transport and binary or compact protocols.

```typescript
type TransportType = 'buffered'
```

The possible protocol types are:

```typescript
type ProtocolType = 'binary' | 'compact'
```

#### Manual Creation

Manually creating your Thrift client allows you to choose the use of another HTTP client library or to reuse a previously created instance of Request.

```typescript
import {
    RequestInstance,
    HttpConnection,
    IHttpConnectionOptions,
} from '@creditkarma/thrift-client'
import * as request from 'request'
import { CoreOptions } from 'request'

import { Calculator } from './codegen/calculator'

const clientConfig: IHttpConnectionOptions = {
    hostName: 'localhost',
    port: 3000,
    path: '/',
    transport: 'buffered',
    protocol: 'binary',
}

// Create Thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: HttpConnection =
    new HttpConnection(requestClient, clientConfig)

const thriftClient: Calculator.Client<CoreOptions> = new Calculator.Client(connection)
```

Here `HttpConnection` is a class that extends the `ThriftConnection` abstract class. You could create custom connections, for instance TCP, by extending the same class.

Also of note here is that the type `IHttpConnectionOptions` does not accept the `requestOptions` parameter. Options to `Request` here would be passed directly to the call to `request.defaults({})`.

### Creating a TCP Client

Creating a TCP client is much like creating an HTTP client.

* Use the `createTcpClient` factory function.
* Manually create your own `TcpConnection` object

*Note: Our TcpConnection object uses an underlying connection pool instead of all client requests reusing the same connection. This pool is configurable. We use [GenericPool](https://github.com/coopernurse/node-pool) for managing our connection pool. Pool options are passed directly through to GenericPool.*

#### `createTcpClient`

Using the `createTcpClient` function you pass in two arguments, the first is your Thrift service client class and the second is a map of options to configure the underlying TCP connection.

```typescript
import {
    createTcpClient
} from '@creditkarma/thrift-client'

import { Calculator } from './codegen/calculator'

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createTcpClient(Calculator.Client, {
    serviceName: 'calculator-service',
    hostName: 'localhost',
    port: 8080,
})
```

##### Options

The available options are:

* serviceName (optional): The name of your service. Used for logging.
* hostName (required): The name of the host to connect to.
* port (required): The port number to attach to on the host.
* timeout (optional): Connection timeout in milliseconds. Defaults to 5000.
* transport (optional): Name of the Thrift transport type to use. Defaults to 'buffered'.
* protocol (optional): Name of the Thrift protocol type to use. Defaults to 'binary'.
* pool (optional): Options to configure the underlying connection pool.
* register (optional): A list of filters to apply to your client. More on this later.

#### Manual Creation

```typescript
import {
    TcpConnection,
} from '@creditkarma/thrift-client'

import { Calculator } from './codegen/calculator'

const connection: TcpConnection = new TcpConnection({
    hostName: 'localhost',
    port: 3000,
    transport: 'buffered',
    protocol: 'binary',
})

const thriftClient: Calculator.Client<CoreOptions> = new Calculator.Client(connection)
```

Here `TcpConnection` is a class that extends the `ThriftConnection` abstract class. You could create custom connections, for instance TCP, by extending the same class.

### Making Service Calls with our Client

However we chose to make our client, we use them in the same way.

Notice the optional context parameter. All service client methods can take an optional context parameter. This context refers to the request options for Request library (CoreOptions). These options will be deep merged with any default options (passed in on instantiation) before sending a service request. This context can be used to do useful things like tracing or authentication. Usually this will be used for changing headers on a per-request basis.

Related to context you will notice that our Thrift service client is a generic `Calculator.Client<ThriftContext<CoreOptions>>`. This type parameter refers to the type of the context, here the `ThriftContext<CoreOptions>` which extends the options interface from the Request library.

```typescript
import {
    createHttpClient
} from '@creditkarma/thrift-client'

import { CoreOptions } from 'request'
import * as express from 'express'

import { Calculator } from './codegen/calculator'

const serverConfig = {
    hostName: 'localhost',
    port: 8080,
}

// Create Thrift client
const thriftClient: Calculator.Client<ThriftContext<CoreOptions>> = createHttpClient(Calculator.Client, {
    hostName: 'localhost',
    port: 8080,
    requestOptions: {} // CoreOptions to pass to Request
})

// This receives a query like "http://localhost:8080/add?left=5&right=3"
app.get('/add', (req: express.Request, res: express.Response): void => {
    // Request contexts allow you to do tracing and auth
    const context: CoreOptions = {
        headers: {
            'x-trace-id': 'my-trace-id'
        }
    }

    // Client methods return a Promise of the expected result
    thriftClient.add(req.query.left, req.query.right, context).then((result: number) => {
        res.send(result)
    }, (err: any) => {
        res.status(500).send(err)
    })
})

app.listen(serverConfig.port, () => {
    console.log(`Web server listening at http://${serverConfig.hostName}:${serverConfig.port}`)
})
```

### Client Filters

Sometimes you'll want to universally filter or modify requests and/or responses. This is done with filters. If you've used many server libraries you are probably used to the idea of plugins or middleware.

A filter is an object that consists of a handler function and an optional list of client method names to apply the filter to.

Filters are applied in the order in which they are registered.

```typescript
interface IRequestResponse {
    statusCode: number
    headers: IRequestHeaders
    body: Buffer
}

type NextFunction<Options> =
    (data?: Buffer, options?: Options) => Promise<IRequestResponse>

interface IThriftClientFilterConfig<Options> {
    methods?: Array<string>
    handler(request: IThriftRequest<Options>, next: NextFunction<Options>): Promise<IRequestResponse>
}
```

The `handler` function receives as its arguments the `IThriftRequest` object and the next `RequestHandler` in the chain. When you are done applying your filter you `return` the call to `next`. When calling `next` you can optionally pass along a modified Thrift data `Buffer` or new options to apply to the request. `Options` is almost always going to be `CoreOptions` for the underlying request library.

#### IThriftRequest

The `IThriftRequest` object wraps the outgoing data with some useful metadata about the current request.

```typescript
export interface IThriftRequest<Context> {
    data: Buffer
    methodName: string
    uri: string
    context: Context
}
```

The `data` attribute is the outgoing Thrift payload. The `methodName` is the name of the Thrift service method being called.

The other interesting one is `context`. The context is the data passed through in the service method call.

If we look back at our previous client example we find this:

```typescript
// This receives a query like "http://localhost:8080/add?left=5&right=3"
app.get('/add', (req: express.Request, res: express.Response): void => {
    // Request contexts allow you to do tracing and auth
    const context: CoreOptions = {
        headers: {
            'x-trace-id': 'my-trace-id'
        }
    }

    // Client methods return a Promise of the expected result
    thriftClient.add(req.query.left, req.query.right, context).then((result: number) => {
        res.send(result)
    }, (err: any) => {
        res.status(500).send(err)
    })
})
```

Where the context passed through is an instance of `CoreOptions`. These options are passed through to modify the outgoing request. Any filter in the filter chain can modify this data.

To modify this context one needs to pass the updated context to the `next` function.

```typescript
return next(request.data, updatedContext)
```

#### Applying Filters to Outgoing Requests

Something you may want to do with middlware is to apply some common HTTP headers to every outgoing request from your service. Maybe there is a token your service should attach to every outgoing request.

You could do something like this:

```typescript
import {
    createHttpClient,
    IThriftRequest,
} from '@creditkarma/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createHttpClient(Calculator.Client, {
    hostName: 'localhost',
    port: 8080,
    register: [ {
        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            return next(request.data, {
                headers: {
                    'x-fake-token': 'fake-token',
                },
            })
        },
    } ]
})
```

This sends data along unaltered, but adds a header `x-fake-token` to the outgoing request. When you send along options, the options are deep merged with any previous options that were applied.

#### Applying Filters to Incoming Responses

To apply filters to the response you would call `.then` on the `next` function. This would allow you to inspect or modify the response before allowing it to proceed up the chain.

```typescript
import {
    createHttpClient,
    IThriftRequest
} from '@creditkarma/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createHttpClient(Calculator.Client, {
    hostName: 'localhost',
    port: 8080,
    register: [ {
        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            return next().then((res: IRequestResponse) => {
                if (validateResponse(res.body)) {
                    return res
                } else {
                    throw new Error('Invalid data returned')
                }
            })
        },
    } ]
})
```

#### Adding Filters to HttpConnection Object

When you're not using `createHttpClient` you can add filters directly to the connection instance.

```typescript
// Create thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: HttpConnection =
    new HttpConnection(requestClient, clientConfig)

connection.register({
    handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
        return next(request.data, {
            headers: {
                'x-fake-token': 'fake-token',
            },
        })
    },
})

const thriftClient: Calculator.Client = new Calculator.Client(connection)
```

The optional `register` option takes an array of filters to apply. Unsurprisingly they are applied in the order you pass them in.

#### Available Filters

These client filters are maintained as part of this repository:

* [ThriftClientContextFilter](https://github.com/creditkarma/thrift-server/tree/master/packages/thrift-client-context-filter) - This is useful for TCP clients. It is a filter for appending Thrift objects onto an existing Thrift payload.
* [ThriftClientTTwitterFilter](https://github.com/creditkarma/thrift-server/tree/master/packages/thrift-client-ttwitter-filter) - This is for appending a TTwitter context onto an existing Thrift payload. This is for compatibility with Twitter's [Finagle](https://twitter.github.io/finagle/) framework.
* [ThriftClientZipkinFilter](https://github.com/creditkarma/thrift-server/tree/master/packages/thrift-client-zipkin-filter) - This is for supporting distributed tracing with [Zipkin](https://github.com/openzipkin/zipkin-js).

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
