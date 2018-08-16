import { Int64, readThriftMethod } from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'
import * as net from 'net'

import {
    createHttpClient,
    createTcpClient,
    IRequestResponse,
    IThriftRequest,
    NextFunction,
} from '../../../main'

import { CoreOptions } from 'request'

import {
    APACHE_SERVER_CONFIG,
    CALC_SERVER_CONFIG,
} from '../config'

import { expect } from 'code'
import * as Lab from 'lab'

import {
    Calculator,
    IChoice,
} from '../../generated/calculator-service'

import { ISharedStruct } from '../../generated/shared'

import { createServer as addService } from '../add-service'
import { createServer as apacheService } from '../apache-service'
import { createServer as calculatorService } from '../calculator-service'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('createHttpClient', () => {
    describe('Basic Usage', () => {
        let client: Calculator.Client<CoreOptions>
        let calcServer: Hapi.Server
        let addServer: Hapi.Server

        before(async () => {
            client = createHttpClient(Calculator.Client, CALC_SERVER_CONFIG)
            calcServer = calculatorService()
            addServer = addService()
            return Promise.all([
                calcServer.start(),
                addServer.start(),
            ]).then((err) => {
                console.log('Thrift server running')
            })
        })

        after(async () => {
            return Promise.all([
                calcServer.stop(),
                addServer.stop(),
            ]).then((err) => {
                console.log('Thrift server stopped')
            })
        })

        it('should corrently handle a service client request', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping().then((response: any) => {
                expect(response).to.equal(undefined)
            })
        })

        it('should corrently call endpoint with binary data', async () => {
            const word: string = 'test_binary'
            const data: Buffer = Buffer.from(word, 'utf-8')
            return client.echoBinary(data).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should corrently call endpoint that string data', async () => {
            const word: string = 'test_string'
            return client.echoString(word).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should correctly call endpoint with lists as parameters', async () => {
            return client
                .mapOneList([1, 2, 3, 4])
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([2, 3, 4, 5])
                })
        })

        it('should correctly call endpoint with maps as parameters', async () => {
            return client
                .mapValues(new Map([['key1', 6], ['key2', 5]]))
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([6, 5])
                })
        })

        it('should correctly call endpoint that returns a map', async () => {
            return client
                .listToMap([['key_1', 'value_1'], ['key_2', 'value_2']])
                .then((response: Map<string, string>) => {
                    expect(response).to.equal(
                        new Map([['key_1', 'value_1'], ['key_2', 'value_2']]),
                    )
                })
        })

        it('should call an endpoint with union arguments', async () => {
            const firstName: IChoice = { firstName: { name: 'Louis' } }
            const lastName: IChoice = { lastName: { name: 'Smith' } }

            return Promise.all([
                client.checkName(firstName),
                client.checkName(lastName),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('FirstName: Louis')
                expect(val[1]).to.equal('LastName: Smith')
            })
        })

        it('should call an endpoint with optional parameters', async () => {
            return Promise.all([
                client.checkOptional('test_\nfirst'),
                client.checkOptional(),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('test_\nfirst')
                expect(val[1]).to.equal('undefined')
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5)
                .then((response: ISharedStruct) => {
                    expect(response).to.equal({ code: { status: new Int64(0) }, value: 'test' })
                })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: any) => {
                expect(response).to.equal({ option1: 'foo' })
            })
        })

        it('should allow passing of a request context', async () => {
            return client
                .addWithContext(5, 7, {
                    headers: { 'x-fake-token': 'fake-token' },
                })
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject auth request without context', async () => {
            return client.addWithContext(5, 7).then(
                (response: number) => {
                    expect(false).to.equal(true)
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
        })

        it('should reject for a 500 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: CALC_SERVER_CONFIG.hostName,
                    port: CALC_SERVER_CONFIG.port,
                    path: '/return500',
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with status 500')
                },
                (err: any) => {
                    expect(err.statusCode).to.equal(500)
                },
            )
        })

        it('should reject for a 400 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: CALC_SERVER_CONFIG.hostName,
                    port: CALC_SERVER_CONFIG.port,
                    path: '/return400',
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with status 400')
                },
                (err: any) => {
                    expect(err.statusCode).to.equal(400)
                },
            )
        })

        it('should reject for a request to a missing service', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: 'fakehost',
                    port: 8080,
                    requestOptions: {
                        timeout: 5000,
                    },
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with host not found')
                },
                (err: any) => {
                    console.log('err: ', err)
                    expect(err).to.exist()
                },
            )
        })
    })

    describe('CompactProtocol', () => {
        let client: Calculator.Client<CoreOptions>
        let calcServer: Hapi.Server
        let addServer: Hapi.Server

        before(async () => {
            client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                path: CALC_SERVER_CONFIG.path,
                protocol: 'compact',
            })
            calcServer = calculatorService(0, 'compact')
            addServer = addService()
            return Promise.all([
                calcServer.start(),
                addServer.start(),
            ]).then((err) => {
                console.log('Thrift server running')
            })
        })

        after(async () => {
            return Promise.all([
                calcServer.stop(),
                addServer.stop(),
            ]).then((err) => {
                console.log('Thrift server stopped')
            })
        })

        it('should corrently handle a service client request', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping().then((response: any) => {
                expect(response).to.equal(undefined)
            })
        })

        it('should corrently call endpoint with binary data', async () => {
            const word: string = 'test_binary'
            const data: Buffer = Buffer.from(word, 'utf-8')
            return client.echoBinary(data).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should corrently call endpoint that string data', async () => {
            const word: string = 'test_string'
            return client.echoString(word).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should correctly call endpoint with lists as parameters', async () => {
            return client
                .mapOneList([1, 2, 3, 4])
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([2, 3, 4, 5])
                })
        })

        it('should correctly call endpoint with maps as parameters', async () => {
            return client
                .mapValues(new Map([['key1', 6], ['key2', 5]]))
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([6, 5])
                })
        })

        it('should correctly call endpoint that returns a map', async () => {
            return client
                .listToMap([['key_1', 'value_1'], ['key_2', 'value_2']])
                .then((response: Map<string, string>) => {
                    expect(response).to.equal(
                        new Map([['key_1', 'value_1'], ['key_2', 'value_2']]),
                    )
                })
        })

        it('should call an endpoint with union arguments', async () => {
            const firstName: IChoice = { firstName: { name: 'Louis' } }
            const lastName: IChoice = { lastName: { name: 'Smith' } }

            return Promise.all([
                client.checkName(firstName),
                client.checkName(lastName),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('FirstName: Louis')
                expect(val[1]).to.equal('LastName: Smith')
            })
        })

        it('should call an endpoint with optional parameters', async () => {
            return Promise.all([
                client.checkOptional('test_\nfirst'),
                client.checkOptional(),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('test_\nfirst')
                expect(val[1]).to.equal('undefined')
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5)
                .then((response: ISharedStruct) => {
                    expect(response).to.equal({ code: { status: new Int64(0) }, value: 'test' })
                })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: any) => {
                expect(response).to.equal({ option1: 'foo' })
            })
        })

        it('should allow passing of a request context', async () => {
            return client
                .addWithContext(5, 7, {
                    headers: { 'x-fake-token': 'fake-token' },
                })
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject auth request without context', async () => {
            return client.addWithContext(5, 7).then(
                (response: number) => {
                    expect(false).to.equal(true)
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
        })

        it('should reject for a 500 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: CALC_SERVER_CONFIG.hostName,
                    port: CALC_SERVER_CONFIG.port,
                    path: '/return500',
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with status 500')
                },
                (err: any) => {
                    expect(err.statusCode).to.equal(500)
                },
            )
        })

        it('should reject for a 400 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: CALC_SERVER_CONFIG.hostName,
                    port: CALC_SERVER_CONFIG.port,
                    path: '/return400',
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with status 400')
                },
                (err: any) => {
                    expect(err.statusCode).to.equal(400)
                },
            )
        })

        it('should reject for a request to a missing service', async () => {
            const badClient: Calculator.Client<CoreOptions> = createHttpClient(
                Calculator.Client,
                {
                    hostName: 'fakehost',
                    port: 8080,
                    requestOptions: {
                        timeout: 5000,
                    },
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with host not found')
                },
                (err: any) => {
                    console.log('err: ', err)
                    expect(err).to.exist()
                },
            )
        })
    })

    describe('IncomingMiddleware', () => {
        let calcServer: Hapi.Server
        let addServer: Hapi.Server

        before(async () => {
            calcServer = calculatorService()
            addServer = addService()
            return Promise.all([
                calcServer.start(),
                addServer.start(),
            ]).then((err) => {
                console.log('Thrift server running')
            })
        })

        after(async () => {
            return Promise.all([
                calcServer.stop(),
                addServer.stop(),
            ]).then((err) => {
                console.log('Thrift server stopped')
            })
        })

        it('should resolve when middleware allows', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next().then((res: IRequestResponse): Promise<IRequestResponse> => {
                                if (readThriftMethod(res.body) === 'add') {
                                    return Promise.resolve(res)
                                } else {
                                    return Promise.reject(
                                        new Error(
                                            `Unrecognized method name: ${readThriftMethod(request.data)}`,
                                        ),
                                    )
                                }
                            })
                        },
                    },
                ],
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should resolve when middleware passes method filter', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        methods: ['add'],
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next().then((response: IRequestResponse) => {
                                if (readThriftMethod(response.body) === 'add') {
                                    return Promise.resolve(response)
                                } else {
                                    return Promise.reject(
                                        new Error(`Unrecognized method name: ${readThriftMethod(response.body)}`),
                                    )
                                }
                            })
                        },
                    },
                ],
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware rejects', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next().then((res: IRequestResponse) => {
                                if (readThriftMethod(res.body) === 'nope') {
                                    return Promise.resolve(res)
                                } else {
                                    return Promise.reject(
                                        new Error(`Unrecognized method name: ${readThriftMethod(res.body)}`),
                                    )
                                }
                            })
                        },
                    },
                ],
            })

            return client.add(5, 7).then(
                (response: number) => {
                    throw new Error(
                        `Mehtods should fail when middleware rejects`,
                    )
                },
                (err: any) => {
                    expect(err.message).to.equal(
                        'Unrecognized method name: add',
                    )
                },
            )
        })

        it('should skip handler when middleware fails method filter', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        methods: ['nope'],
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next().then(() => {
                                return Promise.reject(
                                    new Error(
                                        `Unrecognized method name: ${readThriftMethod(request.data)}`,
                                    ),
                                )
                            })
                        },
                    },
                ],
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })
    })

    describe('OutgoingMiddleware', () => {
        let calcServer: Hapi.Server
        let addServer: Hapi.Server

        before(async () => {
            calcServer = calculatorService()
            addServer = addService()
            return Promise.all([
                calcServer.start(),
                addServer.start(),
            ]).then((err) => {
                console.log('Thrift server running')
            })
        })

        after(async () => {
            return Promise.all([
                calcServer.stop(),
                addServer.stop(),
            ]).then((err) => {
                console.log('Thrift server stopped')
            })
        })

        it('should resolve when middleware adds auth token', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next(request.data, {
                                headers: {
                                    'x-fake-token': 'fake-token',
                                },
                            })
                        },
                    },
                ],
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should resolve when middleware passes method filter', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        methods: ['addWithContext'],
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next(request.data, {
                                headers: {
                                    'x-fake-token': 'fake-token',
                                },
                            })
                        },
                    },
                ],
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware does not add auth token', async () => {
            const client = createHttpClient(Calculator.Client, CALC_SERVER_CONFIG)

            return client.addWithContext(5, 7).then(
                (response: number) => {
                    throw new Error(
                        `Mehtods should fail when middleware rejects`,
                    )
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
        })

        it('should resolve when middleware fails method filter', async () => {
            const client = createHttpClient(Calculator.Client, {
                hostName: CALC_SERVER_CONFIG.hostName,
                port: CALC_SERVER_CONFIG.port,
                register: [
                    {
                        methods: ['add'],
                        handler(request: IThriftRequest<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
                            return next(request.data, {
                                headers: {
                                    'x-fake-token': 'fake-token',
                                },
                            })
                        },
                    },
                ],
            })

            return client.addWithContext(5, 7).then(
                (response: number) => {
                    throw new Error(
                        `Mehtods should fail when middleware rejects`,
                    )
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
        })
    })
})

describe('createTcpClient', () => {
    let apacheServer: net.Server

    before((done) => {
        apacheServer = apacheService()
        apacheServer.listen(APACHE_SERVER_CONFIG.port, 'localhost', () => {
            console.log(`TCP server running on port[${APACHE_SERVER_CONFIG.port}]`)
            done()
        })
    })

    after((done) => {
        apacheServer.close(() => {
            apacheServer.unref()
            console.log(`TCP server closed`)
            done()
        })
    })

    describe('Basic Usage', () => {
        let client: Calculator.Client<void>

        before(async () => {
            client = createTcpClient<Calculator.Client>(Calculator.Client, {
                hostName: 'localhost',
                port: 8888,
            })
        })

        it('should corrently handle a service client request', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping().then((response: any) => {
                expect(response).to.equal(undefined)
            })
        })

        it('should corrently call endpoint with binary data', async () => {
            const word: string = 'test_binary'
            const data: Buffer = Buffer.from(word, 'utf-8')
            return client.echoBinary(data).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should corrently call endpoint that string data', async () => {
            const word: string = 'test_string'
            return client.echoString(word).then((response: string) => {
                expect(response).to.equal(word)
            })
        })

        it('should correctly call endpoint with lists as parameters', async () => {
            return client
                .mapOneList([1, 2, 3, 4])
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([2, 3, 4, 5])
                })
        })

        it('should correctly call endpoint with maps as parameters', async () => {
            return client
                .mapValues(new Map([['key1', 6], ['key2', 5]]))
                .then((response: Array<number>) => {
                    expect<Array<number>>(response).to.equal([6, 5])
                })
        })

        it('should correctly call endpoint that returns a map', async () => {
            return client
                .listToMap([['key_1', 'value_1'], ['key_2', 'value_2']])
                .then((response: Map<string, string>) => {
                    expect(response).to.equal(
                        new Map([['key_1', 'value_1'], ['key_2', 'value_2']]),
                    )
                })
        })

        it('should call an endpoint with union arguments', async () => {
            const firstName: IChoice = {
                firstName: { name: 'Louis' },
            }

            const lastName: IChoice = {
                lastName: { name: 'Smith' },
            }

            return Promise.all([
                client.checkName(firstName),
                client.checkName(lastName),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('FirstName: Louis')
                expect(val[1]).to.equal('LastName: Smith')
            })
        })

        it('should call an endpoint with optional parameters', async () => {
            return Promise.all([
                client.checkOptional('test_\nfirst'),
                client.checkOptional(),
            ]).then((val: Array<string>) => {
                expect(val[0]).to.equal('test_\nfirst')
                expect(val[1]).to.equal('undefined')
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5).then((response: ISharedStruct) => {
                expect(response).to.equal({ code: { status: new Int64(5) }, value: 'test' })
            })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: any) => {
                expect(response).to.equal({ option1: 'foo' })
            })
        })

        it('should allow passing of a request context', async () => {
            return client
                .addWithContext(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject for a request to a missing service', async () => {
            const badClient: Calculator.Client<void> = createTcpClient<Calculator.Client>(
                Calculator.Client,
                {
                    hostName: 'fakehost',
                    port: 8888,
                },
            )

            return badClient.add(5, 7).then(
                (response: number) => {
                    console.log('res: ', response)
                    throw new Error('Should reject with host not found')
                },
                (err: any) => {
                    console.log('err: ', err)
                    expect(err).to.exist()
                },
            )
        })
    })
})
