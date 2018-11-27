import * as express from 'express'

import { createThriftServer } from '@creditkarma/thrift-server-express'

import { Int64 } from '@creditkarma/thrift-server-core'

import { createHttpClient, IRequest } from '@creditkarma/thrift-client'

import { ZipkinClientFilter } from '@creditkarma/zipkin-client-filter'

import { IMappedStruct, ISharedStruct, ISharedUnion } from './generated/shared'

import {
    Calculator,
    IChoice,
    ICommonStruct,
    Operation,
    Work,
} from './generated/calculator-service'

import { AddService } from './generated/add-service'

import { ADD_SERVER_CONFIG, EXPRESS_CALC_SERVER_CONFIG } from './config'

export function createServer(sampleRate: number = 0): express.Application {
    // Create thrift client
    const addServiceClient: AddService.Client<IRequest> = createHttpClient(
        AddService.Client,
        {
            hostName: ADD_SERVER_CONFIG.hostName,
            port: ADD_SERVER_CONFIG.port,
            register:
                sampleRate > 0
                    ? [
                          ZipkinClientFilter({
                              localServiceName: 'calculator-service',
                              remoteServiceName: 'add-service',
                              tracerConfig: {
                                  endpoint: process.env.ZIPKIN_ENDPOINT,
                                  zipkinVersion:
                                      process.env.ZIPKIN_VERSION === 'v2'
                                          ? 'v2'
                                          : 'v1',
                                  httpInterval: 0,
                              },
                          }),
                      ]
                    : [],
        },
    )

    const serviceHandlers: Calculator.IHandler<express.Request> = {
        ping(): void {
            return
        },
        add(a: number, b: number, context: express.Request): Promise<number> {
            return addServiceClient.add(a, b, { headers: context.headers })
        },
        addInt64(a: Int64, b: Int64, context: express.Request): Promise<Int64> {
            return addServiceClient.addInt64(a, b, context)
        },
        addWithContext(a: number, b: number, context: express.Request): number {
            if (
                context !== undefined &&
                context.headers['x-fake-token'] === 'fake-token'
            ) {
                return a + b
            } else {
                throw new Error('Unauthorized')
            }
        },
        calculate(
            logId: number,
            work: Work,
            context: express.Request,
        ): number | Promise<number> {
            switch (work.op) {
                case Operation.ADD:
                    return addServiceClient.add(work.num1, work.num2, {
                        headers: context.headers,
                    })
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
                code: {
                    status: new Int64(0),
                },
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
        getMappedStruct(index: number): IMappedStruct {
            const map = new Map()
            map.set('one', {
                code: {
                    status: 5,
                },
                value: 'test',
            })

            return {
                data: map,
            }
        },
        echoBinary(word: Buffer): string {
            return word.toString('utf-8')
        },
        echoString(word: string): string {
            return word
        },
        checkName(choice: IChoice): string {
            if (choice.firstName !== undefined) {
                return `FirstName: ${choice.firstName.name}`
            } else if (choice.lastName !== undefined) {
                return `LastName: ${choice.lastName.name}`
            } else {
                throw new Error(`Unknown choice`)
            }
        },
        checkOptional(type?: string): string {
            if (type === undefined) {
                return 'undefined'
            } else {
                return type
            }
        },
        mapOneList(list: Array<number>): Array<number> {
            return list.map((next: number) => next + 1)
        },
        mapValues(map: Map<string, number>): Array<number> {
            return Array.from(map.values())
        },
        listToMap(list: Array<Array<string>>): Map<string, string> {
            return list.reduce(
                (acc: Map<string, string>, next: Array<string>) => {
                    acc.set(next[0], next[1])
                    return acc
                },
                new Map(),
            )
        },
        fetchThing(): ICommonStruct {
            return {
                code: {
                    status: new Int64(0),
                },
                value: 'test',
            }
        },
    }

    const app: express.Application = createThriftServer({
        path: EXPRESS_CALC_SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: new Calculator.Processor(serviceHandlers),
        },
    })

    app.get('/control', (req: express.Request, res: express.Response) => {
        res.send('PASS')
    })

    return app
}
