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

### Install

```sh
$ npm install --save thrift
$ npm install --save @types/thrift
$ npm install --save @creditkarma/thrift-client
```