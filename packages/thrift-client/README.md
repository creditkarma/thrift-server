# Thrift Client

Thrift client library for NodeJS written in TypeScript.


## Running the Sample Application

```sh
$ npm install
$ npm start
```

This will start a web server on localhost:8080.

The sample app can switch between using a Request client or an Axios client by commenting these lines in example/client.ts

```
// Create thrift client
// Using Request
const requestClient: RequestClientApi = request.defaults({});
const thriftClient: Calculator.Client = createClient(Calculator.Client, createConnection(requestClient, config));

// Using Axios
// const requestClient: AxiosInstance = axios.create();
// const thriftClient: Calculator.Client = createClient(Calculator.Client, createAxiosConnection(requestClient, config))
```