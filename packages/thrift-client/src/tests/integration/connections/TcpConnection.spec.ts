import * as thrift from '@creditkarma/thrift-server-core'
import { expect } from 'code'
import * as Lab from 'lab'
import * as net from 'net'

import {
    IRequestResponse,
    NextFunction,
    TcpConnection,
    ThriftContextPlugin,
    TTwitterClientFilter,
} from '../../../main'

import {
    appendThriftObject,
} from '../../../main/plugins/appendThriftObject'

import { createServer } from '../apache-service'

import { createServer as mockCollector } from '../observability/mock-collector'

import {
    Calculator,
} from '../../generated/calculator/calculator'

import {
    SharedStruct,
    SharedUnion,
} from '../../generated/shared/shared'

import {
    Metadata,
} from '../../generated/common/common'

import {
    ResponseHeader,
} from '../../../ttwitter/com/twitter/finagle/thrift/thrift/tracing'

import {
    APACHE_SERVER_CONFIG,
} from '../config'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after
const afterEach = lab.afterEach

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

    describe('Thrift Middleware', () => {
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

        it('should reject when middleware rejects', async () => {
            return client.echoString('fake').then((response: string) => {
                throw new Error('Should reject')
            }, (err: any) => {
                expect(err.message).to.equal('Unrecognized method name: echoString')
            })
        })
    })

    describe('ThriftContextPlugin', () => {
        const PORT: number = 9010
        let connection: TcpConnection<Metadata>
        let client: Calculator.Client<Metadata>
        let mockServer: net.Server

        afterEach((done) => {
            mockServer.close(() => {
                mockServer.unref()
                connection.destory().then(() => {
                    console.log('Connection destroyed')
                    done()
                })
            })
        })

        it('should handle appending data to payload', (done) => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: PORT,
            })

            connection.register(
                ThriftContextPlugin<Metadata, Metadata>({
                    RequestContextClass: Metadata,
                    ResponseContextClass: Metadata,
                }),
            )

            client = new Calculator.Client(connection)

            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    const meta = new Metadata({ traceId: 9 })
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                    const result = new Calculator.AddResult({ success: 89 })
                    result.write(output)
                    output.writeMessageEnd()
                    const data: Buffer = writer.flush()

                    appendThriftObject(meta, data).then((extended: Buffer) => {
                        socket.write(extended)
                    })
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3, new Metadata({ traceId: 1, clientId: 2 })).then((response: number) => {
                    expect(response).to.equal(89)
                    done()
                }).catch((err: any) => {
                    console.log('err: ', err)
                    done(err)
                })
            })
        })

        it('should work with only a request context', (done) => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: PORT,
            })

            connection.register(
                ThriftContextPlugin<Metadata, Metadata>({
                    RequestContextClass: Metadata,
                }),
            )

            client = new Calculator.Client(connection)

            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                    const result = new Calculator.AddResult({ success: 102 })
                    result.write(output)
                    output.writeMessageEnd()
                    const data: Buffer = writer.flush()

                    socket.write(data)
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3, new Metadata({ traceId: 1, clientId: 2 })).then((response: number) => {
                    expect(response).to.equal(102)
                    done()
                }).catch((err: any) => {
                    console.log('err: ', err)
                    done(err)
                })
            })
        })
    })

    describe('TTwitterClientFilter', () => {
        const PORT: number = 9010
        let connection: TcpConnection<void>
        let client: Calculator.Client<void>
        let collectServer: net.Server
        let mockServer: net.Server

        before((done) => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: PORT,
            })

            connection.register(
                TTwitterClientFilter({
                    localServiceName: 'calculator-client',
                    remoteServiceName: 'calculator-service',
                    endpoint: 'http://localhost:9411/api/v1/spans',
                    sampleRate: 1,
                }),
            )

            client = new Calculator.Client(connection)
            mockCollector().then((collector: net.Server) => {
                collectServer = collector
                done()
            })
        })

        after((done) => {
            collectServer.close(() => {
                collectServer.unref()

                mockServer.close(() => {
                    console.log('TCP server closed')
                    mockServer.unref()
                    collectServer.close(() => {
                        collectServer.unref()
                        connection.destory().then(() => {
                            console.log('Connection destroyed')
                            done()
                        })
                    })
                })
            })
        })

        it('should handle appending data to payload', (done) => {
            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    const responseHeader = new ResponseHeader()
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                    const result = new Calculator.AddResult({ success: 61 })
                    result.write(output)
                    output.writeMessageEnd()
                    const data: Buffer = writer.flush()

                    appendThriftObject(responseHeader, data).then((extended: Buffer) => {
                        console.log('socket: write: ', extended)
                        socket.write(extended)
                    })
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3).then((response: number) => {
                    expect(61).to.equal(61)
                    done()
                }).catch((err: any) => {
                    console.log('err: ', err)
                    done(err)
                })
            })
        })
    })
})
