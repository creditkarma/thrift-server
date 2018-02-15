import { createThriftServer } from '@creditkarma/thrift-server-hapi'
import * as Hapi from 'hapi'

import {
    SharedStruct,
    SharedUnion,
} from './generated/shared/shared'

import {
    SERVER_CONFIG,
} from './config'

import {
    Calculator,
    Choice,
    InvalidResult,
    Operation,
    Work,
} from './generated/calculator/calculator'

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
            const result = a + b
            if (result < 50) {
                return result
            } else {
                throw new InvalidResult({ message: 'Too big', code: { status: 500 } })
            }
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
            return {
                key: 0,
                value: 'test',
            }
        },
        getUnion(index: number): SharedUnion {
            if (index === 1) {
                return { option1: 'foo' }
            } else {
                return { option2: 'bar' }
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
        mapOneList(list: number[]): number[] {
            return list.map((next: number) => next + 1)
        },
        mapValues(map: Map<string, number>): number[] {
            return Array.from(map.values())
        },
        listToMap(list: string[][]): Map<string, string> {
            return list.reduce((acc: Map<string, string>, next: string[]) => {
                acc.set(next[0], next[1])
                return acc
            }, new Map())
        },
    })

    /**
     * Creates Hapi server with thrift endpoint.
     */
    const server: Hapi.Server = createThriftServer({
        serviceName: 'calculator-service',
        port: SERVER_CONFIG.port,
        path: SERVER_CONFIG.path,
        handler: impl,
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
