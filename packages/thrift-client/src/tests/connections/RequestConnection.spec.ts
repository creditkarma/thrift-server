import { readThriftMethod } from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'

import { RequestConnection, RequestInstance } from '../../main'

import * as request from 'request'
import { CoreOptions } from 'request'

import { SERVER_CONFIG } from '../config'

import { expect } from 'code'
import * as Lab from 'lab'

import { createServer } from '../server'

import { Calculator } from '../generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('RequestConnection', () => {
    let server: Hapi.Server

    before(async () => {
        server = createServer()
        return server.start().then((err) => {
            console.log('Thrift server running')
        })
    })

    after(async () => {
        return server.stop().then(() => {
            console.log('Thrift server stopped')
        })
    })

    describe('Basic Usage', () => {
        let connection: RequestConnection
        let client: Calculator.Client<CoreOptions>

        before(async () => {
            const requestClient: RequestInstance = request.defaults({})
            connection = new RequestConnection(requestClient, SERVER_CONFIG)
            client = new Calculator.Client(connection)
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

        it('should corrently handle a service client request that returns a struct', async () => {
            return client
                .getStruct(5)
                .then((response: { key: number; value: string }) => {
                    expect(response).to.equal({ key: 0, value: 'test' })
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
                    headers: { 'X-Fake-Token': 'fake-token' },
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
            const requestClient: RequestInstance = request.defaults({})
            const badConnection: RequestConnection = new RequestConnection(
                requestClient,
                {
                    hostName: SERVER_CONFIG.hostName,
                    port: SERVER_CONFIG.port,
                    path: '/return500',
                },
            )
            const badClient: Calculator.Client<
                CoreOptions
            > = new Calculator.Client(badConnection)

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
            const requestClient: RequestInstance = request.defaults({})
            const badConnection: RequestConnection = new RequestConnection(
                requestClient,
                {
                    hostName: SERVER_CONFIG.hostName,
                    port: SERVER_CONFIG.port,
                    path: '/return400',
                },
            )
            const badClient: Calculator.Client<CoreOptions> =
                new Calculator.Client(badConnection)

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
            const requestClient: RequestInstance = request.defaults({
                timeout: 5000,
            })
            const badConnection: RequestConnection = new RequestConnection(
                requestClient,
                {
                    hostName: 'fakehost',
                    port: 8080,
                },
            )
            const badClient: Calculator.Client<CoreOptions> =
                new Calculator.Client(badConnection)

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with host not found')
                },
                (err: any) => {
                    expect(err.message).to.equal(
                        'getaddrinfo ENOTFOUND fakehost fakehost:8080',
                    )
                },
            )
        })
    })

    describe('IncomingMiddleware', () => {
        it('should resolve when middleware allows', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                handler(data: Buffer): Promise<Buffer> {
                    if (readThriftMethod(data) === 'add') {
                        return Promise.resolve(data)
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${readThriftMethod(
                                    data,
                                )}`,
                            ),
                        )
                    }
                },
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should resolve when middleware passes method filter', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                methods: ['add'],
                handler(data: Buffer): Promise<Buffer> {
                    if (readThriftMethod(data) === 'add') {
                        return Promise.resolve(data)
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${readThriftMethod(
                                    data,
                                )}`,
                            ),
                        )
                    }
                },
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware rejects', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                handler(data: Buffer): Promise<Buffer> {
                    if (readThriftMethod(data) === 'nope') {
                        return Promise.resolve(data)
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${readThriftMethod(
                                    data,
                                )}`,
                            ),
                        )
                    }
                },
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
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                methods: ['nope'],
                handler(data: Buffer): Promise<Buffer> {
                    return Promise.reject(
                        new Error(
                            `Unrecognized method name: ${readThriftMethod(
                                data,
                            )}`,
                        ),
                    )
                },
            })

            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })
    })

    describe('OutgoingMiddleware', () => {
        it('should resolve when middleware adds auth token', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                type: 'request',
                handler(context: CoreOptions): Promise<CoreOptions> {
                    return Promise.resolve(
                        Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }),
                    )
                },
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should resolve when middleware passes method filter', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                type: 'request',
                methods: ['addWithContext'],
                handler(context: CoreOptions): Promise<CoreOptions> {
                    return Promise.resolve(
                        Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }),
                    )
                },
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware does not add auth token', async () => {
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

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
            const requestClient: RequestInstance = request.defaults({})
            const connection: RequestConnection = new RequestConnection(
                requestClient,
                SERVER_CONFIG,
            )
            const client = new Calculator.Client<CoreOptions>(connection)

            connection.register({
                type: 'request',
                methods: ['add'],
                handler(context: CoreOptions): Promise<CoreOptions> {
                    return Promise.resolve(
                        Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }),
                    )
                },
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
