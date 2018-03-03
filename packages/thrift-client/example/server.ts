import { config } from '@creditkarma/dynamic-config'
import { createThriftServer } from '@creditkarma/thrift-server-hapi'
import Hapi = require('hapi');

import { Operation, Calculator, Work } from './generated/calculator/calculator'
import { SharedStruct, SharedUnion } from './generated/shared/shared'

(async function startService(): Promise<void> {
    const SERVER_CONFIG = await config().get('server')

    const impl = new Calculator.Processor({
        ping(): void {},
        add(a: number, b: number): number {
            return a + b;
        },
        calculate(logId: number, work: Work): number {
            switch (work.op) {
                case Operation.ADD:
                    return work.num1 + work.num2;
                case Operation.SUBTRACT:
                    return work.num1 - work.num2;
                case Operation.DIVIDE:
                    return work.num1 / work.num2;
                case Operation.MULTIPLY:
                    return work.num1 * work.num2;
            }
        },
        zip(): void {},
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
    })

    const server: Hapi.Server = createThriftServer({
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
        }
    })

    server.start((err: any) => {
        if (err) {
            throw err
        }

        if (server.info !== null) {
            console.log(`Thrift server running at: ${server.info.uri}`)
        }
    })
}())
