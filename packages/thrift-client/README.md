# Thrift Client

Thrift client library for NodeJS written in TypeScript.

## Running the Sample Application

```sh
$ npm install
$ npm start
```

This will start a web server on localhost:8080. The sample app has a UI you can visit from a web browser.

The sample app can switch between using a Request client or an Axios client by commenting these lines in example/client.ts. Using Request is the perferred method.

```typescript
// Create thrift client
// Using Request
const requestClient: RequestInstance = request.defaults({})
const connection: RequestConnection = fromRequest(requestClient, config)
const thriftClient: Calculator.Client<CoreOptions> = new Calculator.Client(connection)

// Using Axios
const requestClient: AxiosInstance = axios.create()
const connection: AxiosConnection = fromAxios(requestClient, config)
const thriftClient: Calculator.Client<AxiosRequestConfig> = new Calculator.Client(connection)
```

## Usage

Functions are available to wrap either Request or Axios instances for making requests to a Thrift service.

### Codegen

Requires @creditkarma/thrift-typescript >= v1.0.2

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
$ npm install --save thrift
$ npm install --save @types/thrift
$ npm install --save @creditkarma/thrift-client
$ npm install --save axios
```

### Creating a Client

In this example we will use Request to create our service client. Using the Axios library is very similar.

Notice the optional context parameter. All service client methods can take an optional context parameter. This context refers to the request options for Request or Axios respectively. These options will be deep merged with any default options before sending a service request. This context can be used to do useful things like tracing or authentication. Usually this will be used for changing headers on a per-request basis.

```typescript
import {
  fromRequest,
  RequestInstance,
  RequestConnection,
  IHttpConnectionOptions,
} from '@creditkaram/thrift-client'

import * as request from 'request'
import * as express from 'express'
import { Calculator } from './codegen/calculator'

const app = express()

// 'transport', 'protocol' and 'path' are optional and will default to these values
const clientConfig: IHttpConnectionOptions = {
  hostName: 'localhost',
  port: 3000,
  path: '/',
  transport: 'buffered',
  protocol: 'binary',
}

const serverConfig = {
  hostName: 'localhost',
  port: 8080,
}

// Create thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: RequestConnection =
  fromRequest(requestClient, clientConfig)

const thriftClient: Calculator.Client = new Calculator.Client(connection)

// This receives a query like "http://localhost:8080/add?left=5&right=3"
app.get('/add', (req: express.Request, res: express.Response): void => {
  // Request contexts allow you to do tracing and auth
  const context: AxiosRequestConfig = {
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

#### Options

The possible transport types are:

```typescript
type TransportType = 'buffered' | 'framed'
```

The possible protocol types are:

```typescript
type ProtocolType = 'binary' | 'compact' | 'json'
```

#### `createClient`

It may seem unnecessary to have to create a Request/Axios instance and a connection before finally making a client. We include this to allow maximum customization. Usually you will want to use the `createClient` function that will do this wiring for you.

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  requestOptions: {} // CoreOptions to pass to Request
})
```

The options here extend `IHttpConnectionOptions`, so you can pass all the same options. The service client created by `createClient` uses the Request library for its underlying connection. As such, the `requestOptions` here will be of type `CoreOptions`.

### Middleware

Sometimes you'll want to universally filter or modify response, or you'll want to universally add certain headers to outgoing client requests. You can do these things with middleware.

A middleware is an object that consists of a handler function, the type of middleware and an optional list of client method names to apply the middleware to.

Middleware are applied in the order in which they are registered.

```typescript
interface IIncomingMiddleware {
  type: 'incoming'
  methods: Array<string>
  hander(data: Buffer): Promise<Buffer>
}

interface IOutgoingMiddleware<Context> {
  type: 'outgoing'
  mthods: Array<string>
  handler(context: Context): Promise<Context>
}
```

#### Incoming Middleware

`incoming` middleware acts on responses coming into the client. The middleware receives the response before the Thrift processor so the data is a raw `Buffer` object. The middleware returns a `Promise` of data that will continue down the middleware chain to the Thrift processor. If the `Promise` is rejected the chain is broken and the client method call is rejected.

`incoming` is the default middleware, so if the `type` property is ommited the middleware will be assumed to be incoming.

```typescript
// Create thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: RequestConnection =
  fromRequest(requestClient, clientConfig)

connection.register({
  type: 'incoming',
  handler(data: Buffer): Promise<Buffer> {
    if (validatePayload(data)) {
      return Promise.resolve(data)
    } else {
      return Promise.reject(new Error('Payload of thrift response is invalid'))
    }
  }
})

const thriftClient: Calculator.Client = new Calculator.Client(connection)
```

#### Outgoing Middleware

`outgoing` middleware acts on the outgoing request. The middleware handler function operates on the request `context`. The context is of type `CoreOptions` when using Request and type `AxiosRequestConfig` when using Axios. Changes to the context are applied before any context is passed to a client method. Therefore the context passed to a client method will have priority over the middleware handler.

Here, the `X-Fake-Token` will be added to every outgoing client method call:

```typescript
// Create thrift client
const requestClient: RequestInstance = request.defaults({})

const connection: RequestConnection =
  fromRequest(requestClient, clientConfig)

connection.register({
  type: 'outgoing',
  handler(context: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    return Promise.resolve(Object.assign({}, context, {
      headers: {
        'X-Fake-Token': 'fake-token',
      },
    }))
  },
})

const thriftClient: Calculator.Client = new Calculator.Client(connection)
```

#### `createClient`

When using middleware with `createClient` you can pass middleware in as an option.

```typescript
import {
  createClient
} from '@creditkaram/thrift-client'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client = createClient(Calculator.Client, {
  hostName: 'localhost',
  port: 8080,
  register: [{
    type: 'outgoing',
    handler(context: AxiosRequestConfig): Promise<AxiosRequestConfig> {
      return Promise.resolve(Object.assign({}, context, {
        headers: {
          'X-Fake-Token': 'fake-token',
        },
      }))
    },
  }]
})
```

The optional `register` option takes an array of middleware to apply. Unsurprisingly they are applied in the order you pass them in.

## Creating Custom Connections

While Thrift Client includes support for Axios and Request using another Http client library should be easy. You need to extend the abstract HttpConnection class and implement the abstract write method.

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
