import {
  RequestInstance,
  // fromAxios,
  fromRequest,
  RequestConnection,
  // AxiosConnection,
} from '../src/main/'

import * as path from 'path'
import * as request from 'request'
import { CoreOptions } from 'request'
// import { default as axios, AxiosInstance, AxiosRequestConfig }from 'axios'
import * as express from 'express'

import {
  Work,
  Operation,
  Calculator,
} from './generated/calculator/calculator'

import {
  SERVER_CONFIG,
  CLIENT_CONFIG
} from './config'

// Get express instance
const app = express()

// Create thrift client
// Using Request
const requestClient: RequestInstance = request.defaults({})
const connection: RequestConnection =
  fromRequest(requestClient, {
    hostName: SERVER_CONFIG.host,
    port: SERVER_CONFIG.port
  })
const thriftClient: Calculator.Client<CoreOptions> = new Calculator.Client(connection)

// Using Axios
// const requestClient: AxiosInstance = axios.create()
// const connection: AxiosConnection = fromAxios(requestClient, config)
// const thriftClient: Calculator.Client<AxiosRequestConfig> = new Calculator.Client(connection)

function symbolToOperation(sym: string): Operation {
  switch (sym) {
    case 'add':
      return Operation.ADD
    case 'subtract':
      return Operation.SUBTRACT
    case 'multiply':
      return Operation.MULTIPLY
    case 'divide':
      return Operation.DIVIDE
    default:
      throw new Error(`Unrecognized operation: ${sym}`)
  }
}

app.get('/', (req: express.Request, res: express.Response): void => {
  res.sendFile(path.join(__dirname, './index.html'))
})

app.get('/ping', (req: express.Request, res: express.Response): void => {
  thriftClient.ping().then(() => {
    res.send('success')
  }, (err: any) => {
    console.log('err: ', err)
    res.status(500).send(err)
  })
})

app.get('/calculate', (req: express.Request, res: express.Response): void => {
  const work: Work = new Work({
    num1: req.query.left,
    num2: req.query.right,
    op: symbolToOperation(req.query.op)
  })
  thriftClient.calculate(1, work).then((val: number) => {
    res.send(`result: ${val}`)
  }, (err: any) => {
    res.status(500).send(err)
  })
})

app.listen(CLIENT_CONFIG.port, () => {
  console.log(`Web server listening at http://${CLIENT_CONFIG.host}:${CLIENT_CONFIG.port}`)
})
