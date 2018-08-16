import { config } from '@creditkarma/dynamic-config'
import { createThriftServer, ZipkinTracingHapi } from '@creditkarma/thrift-server-hapi'
import * as Hapi from 'hapi'

import {
    createHttpClient,
    ZipkinClientFilter,
    IRequest,
} from '../src/main/'

import { Operation, Calculator, IWork } from './generated/calculator-service'
import { AddService } from './generated/add-service'

(async function startService(): Promise<void> {
    const SERVER_CONFIG = await config().get('calculator-service')
    const ADD_SERVER_CONFIG = await config().get('add-service')

    // Create thrift client
    const thriftClient: AddService.Client<IRequest> = createHttpClient(AddService.Client, {
        hostName: ADD_SERVER_CONFIG.host,
        port: ADD_SERVER_CONFIG.port,
        register: [
            ZipkinClientFilter({
                localServiceName: 'calculator-service',
                remoteServiceName: 'add-service',
                endpoint: 'http://localhost:9411/api/v1/spans',
                httpInterval: 1000,
                httpTimeout: 5000,
                sampleRate: 1.0,
            })
        ]
    })

    const impl = new Calculator.Processor({
        ping(): void {},
        add(a: number, b: number): Promise<number> {
            return thriftClient.add(a, b)
        },
        calculate(logId: number, work: IWork, context: Hapi.Request): Promise<number> | number {
            switch (work.op) {
                case Operation.ADD:
                    return thriftClient.add(work.num1, work.num2, { headers: context.headers });
                case Operation.SUBTRACT:
                    return work.num1 - work.num2;
                case Operation.DIVIDE:
                    return work.num1 / work.num2;
                case Operation.MULTIPLY:
                    return work.num1 * work.num2;
            }
        }
    })

    const server: Hapi.Server = createThriftServer({
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
        },
    })

    server.register(ZipkinTracingHapi({
        localServiceName: 'calculator-service',
        endpoint: 'http://localhost:9411/api/v1/spans',
        httpInterval: 1000,
        httpTimeout: 5000,
        sampleRate: 1.0,
    }), (err: any) => {
        if (err) {
            console.error(`Error: `, err)
        } else {
            server.start((err: any) => {
                if (err) {
                    throw err
                }

                if (server.info !== null) {
                    console.log(`Calculator service running at: ${server.info.uri}`)
                }
            })
        }
    })
}())
