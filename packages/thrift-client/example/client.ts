import {
  createClient,
} from '../src/client'

import {
  RequestClientApi,
  createConnection,
  createAxiosConnection,
} from '../src/'

import * as path from 'path'
import * as request from 'request'
import { default as axios, AxiosInstance }from 'axios'
import * as express from 'express'

import {
  Work,
  Operation,
  Calculator,
} from './codegen/tutorial/tutorial'

const config = {
  hostName: 'localhost',
  port: 8045
}

// Get express instance
const app = express();

// Create thrift client
// Using Request
const requestClient: RequestClientApi = request.defaults({});
const thriftClient: Calculator.Client = createClient(Calculator.Client, createConnection(requestClient, config));

// Using Axios
// const requestClient: AxiosInstance = axios.create();
// const thriftClient: Calculator.Client = createClient(Calculator.Client, createAxiosConnection(requestClient, config))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/ping', (req, res) => {
  thriftClient.ping().then(() => {
    res.send('success')
  }, (err: any) => {
    res.status(500).send(err);
  })
});

function symbolToOperation(sym: string): Operation {
  switch (sym) {
    case 'add':
      return Operation.ADD;
    case 'subtract':
      return Operation.SUBTRACT;
    case 'multiply':
      return Operation.MULTIPLY;
    case 'divide':
      return Operation.DIVIDE;
    default:
      throw new Error(`Unrecognized operation: ${sym}`);
  }
}

app.get('/calculate', (req, res) => {
  const work: Work = new Work({
    num1: req.query.left,
    num2: req.query.right,
    op: symbolToOperation(req.query.op)
  })
  thriftClient.calculate(1, work).then((val: number) => {
    res.send(`result: ${val}`)
  }, (err: any) => {
    res.status(500).send(err);
  })
});

const server = app.listen(8044, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Web server listening at http://%s:%s', host, port);
});