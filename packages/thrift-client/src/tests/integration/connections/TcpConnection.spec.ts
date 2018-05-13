import * as thrift from '@creditkarma/thrift-server-core'

import * as net from 'net'

import {
    IRequestResponse,
    NextFunction,
    TcpConnection,
} from '../../../main'

import { expect } from 'code'
import * as Lab from 'lab'

import { createServer } from '../apache-service'

import {
    Calculator,
} from '../generated/calculator/calculator'

import {
    SharedStruct,
    SharedUnion,
} from '../generated/shared/shared'

import {
    APACHE_SERVER_CONFIG,
} from '../config'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('TcpConnection', () => {
    let server: net.Server

    before((done) => {
        server = createServer()
        server.listen(APACHE_SERVER_CONFIG.port, 'localhost', () => {
            console.log(`TCP server running on port[${APACHE_SERVER_CONFIG.port}]`)
            done()
        })
    })

    after((done) => {
        server.close(() => {
            server.unref()
            console.log(`TCP server closed`)
            done()
        })
    })

    describe('Basic Usage', () => {
        let connection: TcpConnection
        let client: Calculator.Client<void>

        before(async () => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: 8888,
            })

            client = new Calculator.Client(connection)
        })

        after(async () => {
            return connection.destory().then(() => {
                console.log('Connection destroyed')
            })
        })

        it('should do things', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping().then((response: void) => {
                expect(response).to.equal(undefined)
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5).then((response: SharedStruct) => {
                expect(response).to.equal(new SharedStruct({ key: 5, value: 'test' }))
            })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: SharedUnion) => {
                expect(response).to.equal(new SharedUnion({ option1: 'foo' }))
            })
        })
    })

    describe('Incoming Middleware', () => {
        let connection: TcpConnection
        let client: Calculator.Client<void>

        before(async () => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: 8888,
            })

            connection.register({
                handler(data: Buffer, context: void, next: NextFunction<void>): Promise<IRequestResponse> {
                    return next(data)
                },
            }, {
                methods: ['echoString'],
                handler(data: Buffer, context: void, next: NextFunction<void>): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(data) === 'fake') {
                        return next()

                    } else {
                        return Promise.reject(
                            new Error(`Unrecognized method name: ${thrift.readThriftMethod(data)}`),
                        )
                    }
                },
            })

            client = new Calculator.Client(connection)
        })

        after(async () => {
            return connection.destory().then(() => {
                console.log('Connection destroyed')
            })
        })

        it('should resolve when middleware allows', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should reject when middleware rejects', async () => {
            return client.echoString('fake').then((response: string) => {
                throw new Error('Should reject')
            }, (err: any) => {
                expect(err.message).to.equal('Unrecognized method name: echoString')
            })
        })
    })

    describe('Outgoing Middleware', () => {
        let connection: TcpConnection
        let client: Calculator.Client<void>

        before(async () => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: 8888,
            })

            connection.register({
                handler(data: Buffer, context: void, next: NextFunction<void>): Promise<IRequestResponse> {
                    return next(data)
                },
            }, {
                methods: ['echoString'],
                handler(data: Buffer, context: void, next: NextFunction<void>): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(data) === 'fake') {
                        return next()

                    } else {
                        return Promise.reject(
                            new Error(`Unrecognized method name: ${thrift.readThriftMethod(data)}`),
                        )
                    }
                },
            }, {
                methods: ['addWithContext'],
                handler(data: Buffer, context: void, next: NextFunction<void>): Promise<IRequestResponse> {
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('addWithContext', thrift.MessageType.CALL, 20)
                    const args: Calculator.AddWithContextArgs = new Calculator.AddWithContextArgs({ num1: 20, num2: 60 })
                    args.write(output)
                    output.writeMessageEnd()
                    return next(writer.flush())
                },
            })

            client = new Calculator.Client(connection)
        })

        after(async () => {
            return connection.destory().then(() => {
                console.log('Connection destroyed')
            })
        })

        it('should resolve when passing through middleware', async () => {
            return client.add(5, 7).then((response: number) => {
                expect(response).to.equal(12)
            })
        })

        it('should allow rewriting of request data', async () => {
            return client.addWithContext(5, 7).then((response: number) => {
                expect(response).to.equal(80)
            })
        })
    })
})
