import {
  RequestInstance,
  createClient,
  fromAxios,
  fromRequest,
  HttpConnection,
} from '../src/'

import * as path from 'path'
import * as request from 'request'
import { default as axios, AxiosInstance }from 'axios'
import * as express from 'express'

import {
  Work,
  Operation,
  Calculator,
} from './generated/tutorial/tutorial'

const config = {
  hostName: 'localhost',
  port: 3000
}

// Get express instance
const app = express()

// Create thrift client
// Using Request
const requestClient: RequestInstance = request.defaults({})
const connection: HttpConnection<Calculator.Client> = fromRequest(requestClient, config)
const thriftClient: Calculator.Client = createClient(Calculator.Client, connection)

// Using Axios
// const requestClient: AxiosInstance = axios.create()
// const connection: HttpConnection<Calculator.Client> = fromAxios(requestClient, config)
// const thriftClient: Calculator.Client = createClient(Calculator.Client, connection)

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

const server = app.listen(8080, () => {
  var host = server.address().address
  var port = server.address().port

  console.log('Web server listening at http://%s:%s', host, port)
})