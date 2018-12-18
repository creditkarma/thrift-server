import * as thrift from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'
import * as http from 'http'

import {
    HttpConnection,
    IRequest,
    IRequestResponse,
    IThriftRequest,
    NextFunction,
} from '@creditkarma/thrift-client'

import {
    ThriftClientTTwitterFilter,
    TTwitter,
} from '@creditkarma/thrift-client-ttwitter-filter'

import { CoreOptions } from 'request'

import { HAPI_CALC_SERVER_CONFIG } from '../../config'

import { expect } from 'code'
import * as Lab from 'lab'

import { createServer as addService } from '../../hapi-add-service'
import { createServer as calculatorService } from '../../hapi-calculator-service'
import {
    createServer as mockCollector,
    IMockCollector,
} from '../tracing/mock-collector'

import { Calculator, ICommonStruct } from '../../generated/calculator-service'

import { ISharedUnion } from '../../generated/shared'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('HttpConnection', () => {
    let calcServer: Hapi.Server
    let addServer: Hapi.Server

    before(async () => {
        calcServer = await calculatorService()
        addServer = await addService()
        return Promise.all([calcServer.start(), addServer.start()]).then(
            (err) => {
                console.log('Thrift server running')
            },
        )
    })

    after(async () => {
        return Promise.all([calcServer.stop(), addServer.stop()]).then(
            (err) => {
                console.log('Thrift server stopped')
            },
        )
    })

    describe('Basic Usage', () => {
        let connection: HttpConnection
        let client: Calculator.Client<IRequest>

        before(async () => {
            connection = new HttpConnection(HAPI_CALC_SERVER_CONFIG)
            client = new Calculator.Client(connection)
        })

        it('should corrently handle a service client request', async () => {
            return client.add(5, 7).then(
                (response: number) => {
                    expect(response).to.equal(12)
                },
                (err: any) => {
                    console.log('err: ', err)
                    throw err
                },
            )
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping().then((response: any) => {
                expect(response).to.equal(undefined)
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5).then((response: ICommonStruct) => {
                expect(response).to.equal({
                    code: { status: new thrift.Int64(0) },
                    value: 'test',
                })
            })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: ISharedUnion) => {
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
            const badConnection: HttpConnection = new HttpConnection({
                hostName: HAPI_CALC_SERVER_CONFIG.hostName,
                port: HAPI_CALC_SERVER_CONFIG.port,
                path: '/return500',
            })
            const badClient: Calculator.Client<
                IRequest
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
            const badConnection: HttpConnection = new HttpConnection({
                hostName: HAPI_CALC_SERVER_CONFIG.hostName,
                port: HAPI_CALC_SERVER_CONFIG.port,
                path: '/return400',
            })
            const badClient: Calculator.Client<
                IRequest
            > = new Calculator.Client(badConnection)

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
            const badConnection: HttpConnection = new HttpConnection({
                hostName: 'fakehost',
                port: 8080,
                requestOptions: {
                    timeout: 5000,
                },
            })
            const badClient: Calculator.Client<
                IRequest
            > = new Calculator.Client(badConnection)

            return badClient.add(5, 7).then(
                (response: number) => {
                    throw new Error('Should reject with host not found')
                },
                (err: any) => {
                    expect(err).to.exist()
                },
            )
        })
    })

    describe('Incoming Middleware', () => {
        it('should resolve when middleware allows', async () => {
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(req.data) === 'add') {
                        return next()
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${thrift.readThriftMethod(
                                    req.data,
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
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                methods: ['add'],
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(req.data) === 'add') {
                        return next()
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${thrift.readThriftMethod(
                                    req.data,
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
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(req.data) === 'nope') {
                        return next()
                    } else {
                        return Promise.reject(
                            new Error(
                                `Unrecognized method name: ${thrift.readThriftMethod(
                                    req.data,
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
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                methods: ['nope'],
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    return Promise.reject(
                        new Error(
                            `Unrecognized method name: ${thrift.readThriftMethod(
                                req.data,
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

    describe('Outgoing Middleware', () => {
        it('should resolve when middleware adds auth token', async () => {
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    return next(req.data, {
                        headers: {
                            'x-fake-token': 'fake-token',
                        },
                    })
                },
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should resolve when middleware passes method filter', async () => {
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                methods: ['addWithContext'],
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    return next(req.data, {
                        headers: {
                            'x-fake-token': 'fake-token',
                        },
                    })
                },
            })

            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware does not add auth token', async () => {
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

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

        it('should reject when middleware fails method filter', async () => {
            const connection: HttpConnection = new HttpConnection(
                HAPI_CALC_SERVER_CONFIG,
            )
            const client = new Calculator.Client<IRequest>(connection)

            connection.register({
                methods: ['add'],
                handler(
                    req: IThriftRequest<CoreOptions>,
                    next: NextFunction<CoreOptions>,
                ): Promise<IRequestResponse> {
                    return next(req.data, {
                        headers: {
                            'x-fake-token': 'fake-token',
                        },
                    })
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

    describe('ThriftClientTTwitterFilter', () => {
        const PORT: number = 9010
        let connection: HttpConnection
        let client: Calculator.Client
        let collectServer: IMockCollector
        let mockServer: http.Server

        before(async () => {
            connection = new HttpConnection({
                hostName: 'localhost',
                port: PORT,
            })

            connection.register(
                ThriftClientTTwitterFilter({
                    localServiceName: 'http-calculator-client',
                    remoteServiceName: 'calculator-service',
                    tracerConfig: {
                        endpoint: 'http://localhost:9411/api/v1/spans',
                        sampleRate: 1,
                        httpInterval: 0,
                    },
                }),
            )

            client = new Calculator.Client(connection)
            return mockCollector().then((collector: IMockCollector) => {
                collectServer = collector
            })
        })

        after(async () => {
            return new Promise((resolve, reject) => {
                collectServer.close().then(() => {
                    mockServer.close(() => {
                        console.log('HTTP server closed')
                        mockServer.unref()
                        resolve()
                    })
                })
            })
        })

        it('should handle appending data to payload', async () => {
            return new Promise((resolve, reject) => {
                let count: number = 0
                collectServer.reset()
                mockServer = http.createServer(
                    (
                        req: http.IncomingMessage,
                        res: http.ServerResponse,
                    ): void => {
                        if (count < 1) {
                            count += 1
                            const upgradeResponse: TTwitter.IUpgradeReply = {}
                            const writer: thrift.TTransport = new thrift.BufferedTransport()
                            const output: thrift.TProtocol = new thrift.BinaryProtocol(
                                writer,
                            )
                            output.writeMessageBegin(
                                'add',
                                thrift.MessageType.CALL,
                                1,
                            )
                            TTwitter.UpgradeReplyCodec.encode(
                                upgradeResponse,
                                output,
                            )
                            output.writeMessageEnd()
                            res.writeHead(200)
                            res.end(writer.flush())
                        } else {
                            const responseHeader: TTwitter.IResponseHeader = {}
                            const writer: thrift.TTransport = new thrift.BufferedTransport()
                            const output: thrift.TProtocol = new thrift.BinaryProtocol(
                                writer,
                            )
                            output.writeMessageBegin(
                                'add',
                                thrift.MessageType.CALL,
                                1,
                            )
                            const result = new Calculator.Add__Result({
                                success: 61,
                            })
                            result.write(output)
                            output.writeMessageEnd()
                            const data: Buffer = writer.flush()

                            thrift
                                .appendThriftObject(
                                    responseHeader,
                                    data,
                                    TTwitter.ResponseHeaderCodec,
                                )
                                .then((extended: Buffer) => {
                                    res.writeHead(200)
                                    res.end(extended)
                                })
                        }
                    },
                )

                mockServer.listen(PORT, () => {
                    console.log(`HTTP server listening on port: ${PORT}`)
                    client
                        .add(2, 3)
                        .then((response: number) => {
                            expect(response).to.equal(61)
                            resolve()
                        })
                        .catch((err: any) => {
                            console.log('err: ', err)
                            reject(err)
                        })
                })
            })
        })
    })
})
