import * as Hapi from 'hapi'
import { ThriftPlugin } from '../main/'

import {
  SharedStruct,
} from './generated/shared/shared'

import {
  SERVER_CONFIG,
} from './config'

import {
  Calculator,
  Operation,
  Work,
} from './generated/calculator/calculator'

const server = new Hapi.Server({ debug: { request: ['error'] } })

server.connection({ port: SERVER_CONFIG.port })

/**
 * Register the thrift plugin.
 *
 * This will allow us to define Hapi routes for our thrift service(s).
 * They behave like any other HTTP route handler, so you can mix and match
 * thrift / REST endpoints on the same server instance.
 */
server.register(ThriftPlugin, (err: any) => {
  if (err) {
    throw err
  }
})

/**
 * Implementation of our thrift service.
 *
 * Notice the second parameter, "context" - this is the Hapi request object,
 * passed along to our service by the Hapi thrift plugin. Thus, you have access to
 * all HTTP request data from within your service implementation.
 */
const handlers: Calculator.IHandler<Hapi.Request> = {
  ping(): void {
    return
  },
  add(a: number, b: number): number {
    return a + b
  },
  addWithContext(a: number, b: number, context?: Hapi.Request): number {
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

const impl: Calculator.Processor<Hapi.Request> = new Calculator.Processor<Hapi.Request>(handlers)

/**
 * Route to our thrift service.
 *
 * Payload parsing is disabled - the thrift plugin parses the raw request
 * using whichever protocol is configured (binary, compact, json...)
 */
server.route({
  method: 'POST',
  path: '/thrift',
  handler: {
    thrift: {
      service: impl,
    },
  },
  config: {
    payload: {
      parse: false,
    },
  },
})

/**
 * The Hapi server can process requests that are not targeted to the thrift
 * service
 */
server.route({
  method: 'GET',
  path: '/control',
  handler(request: Hapi.Request, reply: Hapi.ReplyWithContinue) {
    reply('PASS')
  },
})

/**
 * Finally, we're ready to start the server.
 */
server.start((err: any) => {
  if (err) {
    throw err
  }
  console.log('info', `Server running on port ${SERVER_CONFIG.port}`)
})
