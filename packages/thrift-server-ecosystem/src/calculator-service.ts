import { config } from '@creditkarma/dynamic-config'
import {
    createThriftServer,
    IHapiContext,
} from '@creditkarma/thrift-server-hapi'
import * as Hapi from '@hapi/hapi'

import { ZipkinTracingHapi } from '@creditkarma/zipkin-tracing-hapi'

import { createHttpClient, IRequest } from '@creditkarma/thrift-client'

import { ThriftClientZipkinFilter } from '@creditkarma/thrift-client-zipkin-filter'

import { AddService } from './generated/add-service'

import { Calculator, IWork, Operation } from './generated/calculator-service'

async function init(): Promise<void> {
    const SERVER_CONFIG = await config().get('calculator-service')
    const ADD_SERVER_CONFIG = await config().get('add-service')

    // Create thrift client
    const thriftClient: AddService.Client<IRequest> = createHttpClient(
        AddService.Client,
        {
            hostName: ADD_SERVER_CONFIG.host,
            port: ADD_SERVER_CONFIG.port,
            register: [
                ThriftClientZipkinFilter({
                    localServiceName: 'calculator-service',
                    remoteServiceName: 'add-service',
                    tracerConfig: {
                        endpoint: 'http://localhost:9411/api/v1/spans',
                        httpInterval: 1000,
                        httpTimeout: 5000,
                        sampleRate: 1.0,
                    },
                }),
            ],
        },
    )

    const impl = new Calculator.Processor<IHapiContext>({
        ping(): void {
            return
        },
        add(a: number, b: number): Promise<number> {
            return thriftClient.add(a, b)
        },
        calculate(
            logId: number,
            work: IWork,
            context: IHapiContext,
        ): Promise<number> | number {
            switch (work.op) {
                case Operation.ADD:
                    return thriftClient.add(work.num1, work.num2, {
                        headers: context.headers,
                    })
                case Operation.SUBTRACT:
                    return work.num1 - work.num2
                case Operation.DIVIDE:
                    return work.num1 / work.num2
                case Operation.MULTIPLY:
                    return work.num1 * work.num2
                default:
                    throw new Error(`Invalid operation[${work.op}]`)
            }
        },
    })

    const server: Hapi.Server = await createThriftServer({
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
        },
    })

    await server.register({
        plugin: ZipkinTracingHapi({
            localServiceName: 'calculator-service',
            tracerConfig: {
                endpoint: 'http://localhost:9411/api/v1/spans',
                httpInterval: 1000,
                httpTimeout: 5000,
                sampleRate: 1.0,
            },
        }),
    })

    await server.start()
}

init()
