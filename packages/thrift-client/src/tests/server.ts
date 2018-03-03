import { Int64 } from '@creditkarma/thrift-server-core'
import {
    createThriftServer,
    zipkinPlugin,
} from '@creditkarma/thrift-server-hapi'
import * as Hapi from 'hapi'

import { SharedStruct, SharedUnion } from './generated/shared/shared'

import { SERVER_CONFIG } from './config'

import {
    Calculator,
    Choice,
    Operation,
    Work,
} from './generated/calculator/calculator'

import { createClient } from '../main/index'

export function createServer(): Hapi.Server {
    /**
     * Implementation of our thrift service.
     *
     * Notice the second parameter, "context" - this is the Hapi request object,
     * passed along to our service by the Hapi thrift plugin. Thus, you have access to
     * all HTTP request data from within your service implementation.
     */
    const impl = new Calculator.Processor<Hapi.Request>({
        ping(): void {
            return
        },
        add(a: number, b: number): number {
            return a + b
        },
        addInt64(a: Int64, b: Int64, context?: Hapi.Request): Int64 {
            return new Int64(a.toNumber() + b.toNumber())
        },
        addWithContext(a: number, b: number, context?: Hapi.Request): number {
            if (
                context !== undefined &&
                context.headers['x-fake-token'] === 'fake-token'
            ) {
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
        echoBinary(word: Buffer): string {
            return word.toString('utf-8')
        },
        echoString(word: string): string {
            return word
        },
        checkName(choice: Choice): string {
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
    })

    /**
     * Creates Hapi server with thrift endpoint.
     */
    const server: Hapi.Server = createThriftServer({
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
        },
    })

    server.register(
        zipkinPlugin({
            serviceName: 'calculator-service',
            sampleRate: 1,
        }),
        (err: any) => {
            if (err) {
                console.log('error: ', err)
                throw err
            }
        },
    )

    const client: Calculator.Client = createClient(Calculator.Client, {
        serviceName: 'calculator-service',
        hostName: SERVER_CONFIG.hostName,
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
    })

    server.route({
        method: 'GET',
        path: '/add',
        handler(request: Hapi.Request, reply: Hapi.ReplyWithContinue) {
            const left: number = request.query.left
            const right: number = request.query.right
            client
                .add(left, right)
                .then((response: number) => {
                    reply(response)
                })
                .catch((err: any) => {
                    reply(err)
                })
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

    server.route({
        method: 'POST',
        path: '/return500',
        handler(request: Hapi.Request, reply: Hapi.ReplyWithContinue) {
            reply('NOPE').code(500)
        },
    })

    server.route({
        method: 'POST',
        path: '/return400',
        handler(request: Hapi.Request, reply: Hapi.ReplyWithContinue) {
            reply('NOPE').code(400)
        },
    })

    return server
}
