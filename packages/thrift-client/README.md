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
const requestClient: RequestClientApi = request.defaults({});
const thriftClient: MyService.Client = createClient(MyService.Client, createConnection(requestClient, config));

// Using Axios
// const requestClient: AxiosInstance = axios.create();
// const thriftClient: MyService.Client = createClient(MyService.Client, createAxiosConnection(requestClient, config))
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

```typescript
import { createClient, fromAxios, HttpConnection } from '@creditkaram/thrift-client'
import { TBinaryProtocol, TBufferedTransport } from 'thrift'
import { default as axios, AxiosInstance }from 'axios'
import * as express from 'express'
import { MyService } from './codegen/my_service'

const app = express()

// Transport and Protocol are optional and will default to these values
const clientConfig = {
  hostName: 'localhost',
  port: 3000,
  Transport: TBufferedTransport,
  Protocol: TBinaryProtocol,
}

// Create thrift client
const requestClient: AxiosInstance = axios.create()
const connection: HttpConnection<MyService.Client> = fromAxios(requestClient, clientConfig)
const thriftClient: MyService.Client = createClient(MyService.Client, connection)

app.get('/ping', (req: express.Request, res: express.Response): void => {
  thriftClient.ping().then(() => {
    res.send('success')
  }, (err: any) => {
    res.status(500).send(err)
  })
})

const server = app.listen(8080, () => {
  var host = server.address().address
  var port = server.address().port

  console.log('Web server listening at http://%s:%s', host, port)
})
```
