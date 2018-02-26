import * as express from 'express'
import { createThriftServer } from '../../main'

import {
    SharedStruct,
    SharedUnion,
} from './generated/shared/shared'

import {
    Calculator,
    Operation,
    Work,
} from './generated/calculator/calculator'

import { SERVER_CONFIG } from './config'

export function createServer(): express.Application {
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
            return new SharedStruct({
                key: 0,
                value: 'test',
            })
        },
        getUnion(index: number): SharedUnion {
            if (index === 1) {
                return SharedUnion.fromOption1('foo')
            } else {
                return SharedUnion.fromOption2('bar')
            }
        },
    }

    const app: express.Application = createThriftServer({
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: new Calculator.Processor(serviceHandlers),
        }
    })

    app.get('/control', (req: express.Request, res: express.Response) => {
        res.send('PASS')
    })

    return app
}
