import * as Hapi from 'hapi'
import { createThriftServer } from '../../main/'

import {
  ISharedStruct,
  ISharedUnion,
} from './generated/shared'

import {
  SERVER_CONFIG,
} from './config'

import {
  Calculator,
  Operation,
  Work,
} from './generated/calculator'

export function createServer(): Hapi.Server {
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
        getStruct(): ISharedStruct {
            return {
                key: 0,
                value: 'test',
            }
        },
        getUnion(index: number): ISharedUnion {
            if (index === 1) {
                return { option1: 'foo' }
            } else {
                return { option2: 'bar' }
            }
        },
    }

    const server: Hapi.Server = createThriftServer({
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: new Calculator.Processor(handlers),
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

    return server
}
