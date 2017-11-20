import * as bodyParser from 'body-parser'
import * as express from 'express'
import { thriftExpress } from '../main'

import {
  SharedStruct,
} from './generated/shared/shared'

import {
  Calculator,
  Operation,
  Work,
} from './generated/calculator/calculator'

const serviceHandlers: Calculator.IHandler<express.Request> = {
  ping(): void {
    return
  },
  add(a: number, b: number): number {
    return a + b
  },
  addWithContext(a: number, b: number, context?: express.Request): number {
    if (context !== undefined && context.headers['x-fake-token'] === 'fake-token') {
      return a + b
    } else {
      throw new Error('Unauthorized')
    }
  },
  calculate(logId: number, work: Work): number {
    switch (work.op) {
      case Operation.ADD:
        return work.num1 + work.num2
      case Operation.SUBTRACT:
        return work.num1 - work.num2
      case Operation.DIVIDE:
        return work.num1 / work.num2
      case Operation.MULTIPLY:
        return work.num1 * work.num2
    }
  },
  zip(): void {
    return
  },
  getStruct(): SharedStruct {
    return new SharedStruct()
  },
}

const PORT = 8090

const app = express()

app.use(
  '/thrift',
  bodyParser.raw(),
  thriftExpress(Calculator.Processor, serviceHandlers),
)

app.get('/control', (req: express.Request, res: express.Response) => {
  res.send('PASS')
})

app.listen(PORT, () => {
  console.log(`Express server listening on port: ${PORT}`)
})
