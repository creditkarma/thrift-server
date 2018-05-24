import { Int64 } from '@creditkarma/thrift-server-core'

import {
    createThriftServer,
    ZipkinTracingHapi,
} from '@creditkarma/thrift-server-hapi'

import * as Hapi from 'hapi'
import { CoreOptions } from 'request'

import {
    ADD_SERVER_CONFIG,
    CALC_SERVER_CONFIG,
} from './config'

import {
    Calculator,
    Choice,
    Operation,
    Work,
} from '../generated/calculator/calculator'

import {
    AddService,
} from '../generated/calculator/add-service'

import {
    SharedStruct,
    SharedUnion,
} from '../generated/shared/shared'

import {
    createHttpClient,
    ThriftContext,
    ZipkinTracingThriftClient,
} from '../../main/index'

export function createServer(sampleRate: number = 0): Hapi.Server {
    // Create thrift client
    const addServiceClient: AddService.Client<ThriftContext<CoreOptions>> =
        createHttpClient(AddService.Client, {
            hostName: ADD_SERVER_CONFIG.hostName,
            port: ADD_SERVER_CONFIG.port,
            register: (
                (sampleRate > 0) ?
                    [ ZipkinTracingThriftClient({
                        localServiceName: 'calculator-service',
                        remoteServiceName: 'add-service',
                        endpoint: 'http://localhost:9411/api/v1/spans',
                        sampleRate,
                        httpInterval: 0,
                        asyncOptions: {
                            nodeExpiration: 500,
                        },
                    }) ] :
                    []
            ),
        })

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
        add(a: number, b: number, context?: Hapi.Request): Promise<number> {
            return addServiceClient.add(a, b)
        },
        addInt64(a: Int64, b: Int64, context?: Hapi.Request): Promise<Int64> {
            return addServiceClient.addInt64(a, b)
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
        calculate(logId: number, work: Work, context?: Hapi.Request): number | Promise<number> {
            switch (work.op) {
                case Operation.ADD:
                    return addServiceClient.add(work.num1, work.num2)
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
        getStruct(key: number): SharedStruct {
            return new SharedStruct({ key, value: 'test' })
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
        port: CALC_SERVER_CONFIG.port,
        path: CALC_SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
        },
    })

    if (sampleRate > 0) {
        server.register(
            ZipkinTracingHapi({
                localServiceName: 'calculator-service',
                endpoint: 'http://localhost:9411/api/v1/spans',
                sampleRate,
                httpInterval: 0,
                asyncOptions: {
                    nodeExpiration: 503,
                }
            }),
            (err: any) => {
                if (err) {
                    console.log('err: ', err)
                    throw err
                }
            },
        )
    }

    const client: Calculator.Client = createHttpClient(Calculator.Client, {
        serviceName: 'calculator-service',
        hostName: CALC_SERVER_CONFIG.hostName,
        port: CALC_SERVER_CONFIG.port,
        path: CALC_SERVER_CONFIG.path,
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
