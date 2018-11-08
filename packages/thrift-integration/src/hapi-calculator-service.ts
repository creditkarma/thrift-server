import { Int64, ProtocolType } from '@creditkarma/thrift-server-core'

import {
    createThriftServer,
    ZipkinTracingHapi,
} from '@creditkarma/thrift-server-hapi'

import {
    createHttpClient,
    IRequest,
    ZipkinClientFilter,
} from '@creditkarma/thrift-client'

import * as Hapi from 'hapi'

import { IMappedStruct, ISharedStruct, ISharedUnion } from './generated/shared'

import { ADD_SERVER_CONFIG, HAPI_CALC_SERVER_CONFIG } from './config'

import {
    Calculator,
    IChoice,
    ICommonStruct,
    Operation,
    Work,
} from './generated/calculator-service'

import { AddService } from './generated/add-service'

export async function createServer(
    sampleRate: number = 0,
    protocolType: ProtocolType = 'binary',
): Promise<Hapi.Server> {
    // Create thrift client
    const addServiceClient: AddService.Client<IRequest> = createHttpClient(
        AddService.Client,
        {
            hostName: ADD_SERVER_CONFIG.hostName,
            port: ADD_SERVER_CONFIG.port,
            register: (
                (sampleRate > 0) ?
                    [
                        ZipkinClientFilter({
                            localServiceName: 'calculator-service',
                            remoteServiceName: 'add-service',
                            tracerConfig: {
                                endpoint: process.env.ZIPKIN_ENDPOINT,
                                zipkinVersion: process.env.ZIPKIN_VERSION === 'v2' ? 'v2' : 'v1',
                                sampleRate,
                                httpInterval: 0,
                            },
                        }),
                    ] :
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
        add(a: number, b: number, context: Hapi.Request): Promise<number> {
            return addServiceClient.add(a, b, { headers: context.headers })
        },
        addInt64(a: Int64, b: Int64, context: Hapi.Request): Promise<Int64> {
            return addServiceClient.addInt64(a, b, context)
        },
        addWithContext(a: number, b: number, context: Hapi.Request): number {
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
            context: Hapi.Request,
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
    })

    /**
     * Creates Hapi server with thrift endpoint.
     */
    const server: Hapi.Server = await createThriftServer({
        port: HAPI_CALC_SERVER_CONFIG.port,
        path: HAPI_CALC_SERVER_CONFIG.path,
        thriftOptions: {
            serviceName: 'calculator-service',
            handler: impl,
            protocol: protocolType,
        },
    })

    if (sampleRate > 0) {
        await server.register({
            plugin: ZipkinTracingHapi({
                localServiceName: 'calculator-service',
                tracerConfig: {
                    endpoint: process.env.ZIPKIN_ENDPOINT,
                    zipkinVersion: process.env.ZIPKIN_VERSION === 'v2' ? 'v2' : 'v1',
                    sampleRate,
                    httpInterval: 0,
                },
            }),
        })
    }

    const client: Calculator.Client = createHttpClient(Calculator.Client, {
        serviceName: 'calculator-service',
        hostName: HAPI_CALC_SERVER_CONFIG.hostName,
        port: HAPI_CALC_SERVER_CONFIG.port,
        path: HAPI_CALC_SERVER_CONFIG.path,
        register: (
            (sampleRate > 0) ?
                [
                    ZipkinClientFilter({
                        localServiceName: 'calculator-client',
                        remoteServiceName: 'calculator-service',
                        tracerConfig: {
                            endpoint: process.env.ZIPKIN_ENDPOINT,
                            zipkinVersion: process.env.ZIPKIN_VERSION === 'v2' ? 'v2' : 'v1',
                            sampleRate,
                            httpInterval: 0,
                        },
                    }),
                ] :
                []
        ),
    })

    server.route({
        method: 'GET',
        path: '/add',
        async handler(
            request: Hapi.Request,
            reply: Hapi.ResponseToolkit,
        ): Promise<Hapi.ResponseObject> {
            if (typeof request.query === 'object') {
                const left: number = Number(request.query['left'])
                const right: number = Number(request.query['right'])
                return client
                    .add(left, right)
                    .then((response: number) => {
                        return reply.response(`${response}`)
                    })
                    .catch((err: any) => {
                        return reply.response(err).code(500)
                    })
            } else {
                return reply.response(new Error(`No arguments`)).code(400)
            }
        },
    })

    /**
     * The Hapi server can process requests that are not targeted to the thrift
     * service
     */
    server.route({
        method: 'GET',
        path: '/control',
        handler(
            request: Hapi.Request,
            reply: Hapi.ResponseToolkit,
        ): Hapi.ResponseObject {
            return reply.response('PASS')
        },
    })

    server.route({
        method: 'POST',
        path: '/return500',
        handler(
            request: Hapi.Request,
            reply: Hapi.ResponseToolkit,
        ): Hapi.ResponseObject {
            return reply.response('NOPE').code(500)
        },
    })

    server.route({
        method: 'POST',
        path: '/return400',
        handler(
            request: Hapi.Request,
            reply: Hapi.ResponseToolkit,
        ): Hapi.ResponseObject {
            return reply.response('NOPE').code(400)
        },
    })

    return server
}
