# Thrift Client

Thrift client library for NodeJS written in TypeScript.

## Running the Sample Application

```sh
$ npm install
$ npm start
```

This will start a web server on localhost:8080. The sample app has a UI you can visit from a web browser.

## Usage

We're going to go through this step-by-step.

* Install dependencies
* Define our service
* Run codegen on our Thrift IDL
* Create a client
* Make service calls with our client

### Install

All Thrift Server libraries defined most things as peer dependencies to avoid type collisions.

```sh
$ npm install --save-dev @creditkarma/thrift-typescript
$ npm install --save @creditkarma/thrift-server-core"
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

Add a script to your package.json to codegen. The 'target' option is important to make thrift-typescript generate for this library instead of the Apache libraries.

```json
"scripts": {
  "codegen": "thrift-typescript --target thrift-server --sourceDir thrift --outDir codegen
}
```

Then you can run codegen:

```sh
$ npm run codegen
```

### Creating a Client

There are two ways to create clients with the public API.

* Use the `createClient` factory function.
* Manually create your own `HttpConnection` object

#### `createClient`

Using the `createClient` function you pass in two arguments, the first is your Thrift service client class and the second is a map of options to configure the underlying HTTP connection.

When creating a client using this method Thrift Client uses the [Request library](https://github.com/request/request) for making HTTP requests.

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'
import { CoreOptions } from 'request'

import { Calculator } from './codegen/calculator'

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  requestOptions: {} // CoreOptions to pass to Request
})
```

##### Options

The available options are:

* hostName (required): The name of the host to connect to.
* port (required): The port number to attach to on the host.
* path (optional): The path on which the Thrift service is listening. Defaults to '/thrift'.
* https (optional): Boolean value indicating whether to use https. Defaults to false.
* transport (optional): Name of the Thrift transport type to use. Defaults to 'buffered'.
* protocol (optional): Name of the Thrift protocol type to use. Defaults to 'binary'.
* requestOptions (optional): Options to pass to the underlying [Request library](https://github.com/request/request#requestoptions-callback). Defaults to {}.

Currently `@creditkarma/thrift-server-core"` only supports buffered transport and binary protocol. Framed transport along with compact and JSON protocol will be added soon.

```typescript
type TransportType = 'buffered'
```

The possible protocol types are:

```typescript
type ProtocolType = 'binary'
```

#### Manual Creation

Manually creating your Thrift client allows you to choose the use of another HTTP client library or to reuse a previously created instance of Request.

```typescript
import {
  RequestInstance,
  RequestConnection,
  IHttpConnectionOptions,
} from '@creditkaram/thrift-client'
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

const connection: RequestConnection =
  new RequestConnection(requestClient, clientConfig)

const thriftClient: Calculator.Client<CoreOptions> = new Calculator.Client(connection)
```

Here `RequestConnection` is a class that extends the `HttpConnection` abstract class. Later we will look closer at creating this class.

Also of note here is that the type `IHttpConnectionOptions` does not accept the `requestOptions` parameter. Options to Request here would be passed directly to the call to `request.defaults({})`.

### Making Service Calls with our Client

However we chose to make our client, we use them in the same way.

Notice the optional context parameter. All service client methods can take an optional context parameter. This context refers to the request options for Request library (CoreOptions). These options will be deep merged with any default options (passed in on instantiation) before sending a service request. This context can be used to do useful things like tracing or authentication. Usually this will be used for changing headers on a per-request basis.

Related to context you will notice that our Thrift service client is a generic `Calculator.Client<CoreOptions>`. This type parameter refers to the type of the context, here the `CoreOptions` interface from the Request library.

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'

import { CoreOptions } from 'request'
import * as express from 'express'

import { Calculator } from './codegen/calculator'

const serverConfig = {
  hostName: 'localhost',
  port: 8080,
}

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  requestOptions: {} // CoreOptions to pass to Request
})

// This receives a query like "http://localhost:8080/add?left=5&right=3"
app.get('/add', (req: express.Request, res: express.Response): void => {
  // Request contexts allow you to do tracing and auth
  const context: CoreOptions = {
    headers: {
      'X-Trace-Id': 'my-trace-id'
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

### Middleware

Sometimes you'll want to universally filter or modify responses, or you'll want to universally add certain headers to outgoing client requests. You can do these things with middleware.

A middleware is an object that consists of a handler function, the type of middleware and an optional list of client method names to apply the middleware to.

Middleware are applied in the order in which they are registered.

```typescript
interface IResponseMiddleware {
  type: 'reqponse'
  methods: Array<string>
  hander(data: Buffer): Promise<Buffer>
}

interface IRequestMiddleware<Context> {
  type: 'request'
  mthods: Array<string>
  handler(context: Context): Promise<Context>
}
```

#### Response Middleware

`response` middleware acts on responses coming into the client. The middleware receives the response before the Thrift processor so the data is a raw `Buffer` object. The middleware returns a `Promise` of data that will continue down the middleware chain to the Thrift processor. If the `Promise` is rejected the chain is broken and the client method call is rejected.

`response` is the default middleware, so if the `type` property is ommited the middleware will be assumed to be `response`.

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  register: [{
    type: 'response',
    handler(data: Buffer): Promise<Buffer> {
      if (validatePayload(data)) {
        return Promise.resolve(data)
      } else {
        return Promise.reject(new Error('Payload of thrift response is invalid'))
      }
    },
  }]
})
```

#### Request Middleware

`request` middleware acts on the outgoing request. The middleware handler function operates on the request `context`. The context is of type `CoreOptions` when using Request. Changes to the context are applied before any context is passed to a client method. Therefore the context passed to a client method will have priority over the middleware handler.

Here, the `X-Fake-Token` will be added to every outgoing client method call:

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  register: [{
    type: 'request',
    handler(context: CoreOptions): Promise<CoreOptions> {
      return Promise.resolve(Object.assign({}, context, {
        headers: {
          'X-Fake-Token': 'fake-token',
        },
      }))
    },
  }]
})
```

#### Adding Middleware to HttpConnection Object

When you're not using `createClient` you can add middleware directly to the connection instance.

```typescript
// Create thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: RequestConnection =
  new RequestConnection(requestClient, clientConfig)

connection.register({
  type: 'request',
  handler(context: CoreOptions): Promise<CoreOptions> {
    return Promise.resolve(Object.assign({}, context, {
      headers: {
        'X-Fake-Token': 'fake-token',
      },
    }))
  },
})

const thriftClient: Calculator.Client = new Calculator.Client(connection)
```

The optional `register` option takes an array of middleware to apply. Unsurprisingly they are applied in the order you pass them in.

## Creating Custom Connections

While Thrift Client includes support Request using another Http client library should be easy. You need to extend the abstract HttpConnection class and implement the abstract write method.

As an example look at the RequestConnection:

```typescript
export class RequestConnection extends HttpConnection<CoreOptions> {
  private request: RequestAPI<Request, CoreOptions, OptionalUriUrl>

  constructor(requestApi: RequestInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi.defaults({
      // Encoding needs to be explicitly set to null or the response body will be a string
      encoding: null,
      url: `${this.protocol}://${this.hostName}:${this.port}${this.path}`,
    })
  }

  public emptyContext(): CoreOptions {
    return {}
  }

  public write(dataToWrite: Buffer, context: request.CoreOptions = {}): Promise<Buffer> {
    // Merge user options with required options
    const requestOptions: request.CoreOptions = deepMerge(context, {
      body: dataToWrite,
      headers: {
        'content-length': dataToWrite.length,
        'content-type': 'application/octet-stream',
      },
    })

    return new Promise((resolve, reject) => {
      this.request.post(requestOptions, (err: any, response: RequestResponse, body: Buffer) => {
        if (err !== null) {
          reject(err)
        } else if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
          reject(new Error(body.toString()))
        } else {
          resolve(body)
        }
      })
    })
  }
}
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
