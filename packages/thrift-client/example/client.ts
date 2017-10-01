import {
  createClient,
} from '../src/client'

import {
  RequestClientApi,
  createConnection,
  createAxiosConnection,
} from '../src/'

import * as request from 'request'
import { default as axios, AxiosInstance }from 'axios'
import * as express from 'express'

import {
  Calculator
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

app.get('/ping', (req, res) => {
  thriftClient.ping().then(() => {
    console.log('ping');
    res.send('success')
  }, (err: any) => {
    console.log('ping: err: ', err);
    res.status(500).send(err);
  })
});

app.get('/add', (req, res) => {
  thriftClient.add(3, 4).then((val: number) => {
    console.log('add: ', val);
    res.send(`result: ${val}`)
  }, (err: any) => {
    console.log('add: err: ', err);
    res.status(500).send(err);
  })
});

const server = app.listen(8044, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Web server listening at http://%s:%s', host, port);
});