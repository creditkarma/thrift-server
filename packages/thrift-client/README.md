# Thrift Client

Thrift client library for NodeJS written in TypeScript.


## Running the Sample Application

```sh
$ npm install
$ npm start
```

This will start a web server on localhost:8080. The sample app has a UI you can visit from a web browser.

The sample app can switch between using a Request client or an Axios client by commenting these lines in example/client.ts

```
// Create thrift client
// Using Request
const requestClient: RequestInstance = request.defaults({})
const connection: HttpConnection<Calculator.Client> = fromRequest(requestClient, config)
const thriftClient: Calculator.Client = createClient(Calculator.Client, connection)

// Using Axios
// const requestClient: AxiosInstance = axios.create()
// const connection: HttpConnection<Calculator.Client> = fromAxios(requestClient, config)
// const thriftClient: Calculator.Client = createClient(Calculator.Client, connection)
```

## Usage

Functions are available to wrap either Request or Axios instances for making requests to a Thrift service.

### Install

```sh
$ npm install --save thrift
$ npm install --save @types/thrift
$ npm install --save @creditkarma/thrift-client
$ npm install --save axios
```

Given the following service definition we will build a sample client.

```c
service Calculator {
  i32 add(1: i32 left, 2: i32 right)
  i32 subtract(1: i32 left, 2: i32 right)
}
```

Would be used in a TypeScript service client as such:

```typescript
import {
  createClient,
  fromAxios,
  HttpConnection,
  IHttpConnectionOptions,
} from '@creditkaram/thrift-client'

import { default as axios, AxiosInstance }from 'axios'
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
const requestClient: AxiosInstance = axios.create()
const connection: HttpConnection<Calculator.Client> = fromAxios(requestClient, clientConfig)
const thriftClient: Calculator.Client = createClient(Calculator.Client, connection)

// This receives a query like "http://localhost:8080/add?left=5&right=3"
app.get('/add', (req: express.Request, res: express.Response): void => {
  // Client methods return a Promise of the expected result
  thriftClient.add(req.query.left, req.query.right).then((result: number) => {
    res.send(result)
  }, (err: any) => {
    res.status(500).send(err)
  })
})

app.listen(serverConfig.port, () => {
  console.log(`Web server listening at http://${serverConfig.hostName}:${serverConfig.port}`)
})
```

### Options

The possible transport types are:

```typescript
type TransportType =
  'buffered' | 'framed'
```

The possible protocol types are:

```typescript
type ProtocolType =
  'binary' | 'compact' | 'json'
```

## Creating Custom Connections

While Thrift Client includes support for Axios and Request using another Http client library should be easy. You need to extend the abstract HttpConnection class and implement the abstract write method.

As an example look at the AxiosConnection:

```typescript
export class AxiosConnection<TClient> extends HttpConnection<TClient> {
  private request: AxiosInstance

  constructor(requestApi: AxiosInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi
    this.request.defaults.responseType = 'arraybuffer'
    this.request.defaults.baseURL = `http://${this.hostName}:${this.port}`
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    return this.request.post(this.path, dataToWrite).then((value: AxiosResponse) => {
      return Buffer.from(value.data)
    })
  }
}
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
