import * as thrift from '@creditkarma/thrift-server-core'
import { expect } from 'code'
import * as Lab from 'lab'
import * as net from 'net'

import {
    IRequestResponse,
    IThriftRequest,
    NextFunction,
    TcpConnection,
    ThriftContextFilter,
    TTwitter,
    TTwitterClientFilter,
} from '../../../main'

import {
    appendThriftObject,
} from '../../../main/plugins/appendThriftObject'

import { createServer } from '../apache-service'

import { createServer as mockCollector, IMockCollector } from '../tracing/mock-collector'

import {
    Calculator,
} from '../../generated/calculator-service'

import {
    ISharedStruct,
    ISharedUnion,
} from '../../generated/shared'

import {
    IMetadata,
    MetadataCodec,
} from '../../generated/common'

import {
    APACHE_SERVER_CONFIG,
} from '../config'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after
const afterEach = lab.afterEach

const frameCodec: thrift.ThriftFrameCodec = new thrift.ThriftFrameCodec()

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

        it('should handle a simple service call', async () => {
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
            return client.getStruct(5).then((response: ISharedStruct) => {
                expect(response).to.equal({
                    code: {
                        status: new thrift.Int64(5),
                    },
                    value: 'test',
                })
            })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1).then((response: ISharedUnion) => {
                expect(response).to.equal({ option1: 'foo' })
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
                handler(request: IThriftRequest<void>, next: NextFunction<void>): Promise<IRequestResponse> {
                    return next(request.data)
                },
            }, {
                methods: ['echoString'],
                handler(request: IThriftRequest<void>, next: NextFunction<void>): Promise<IRequestResponse> {
                    if (thrift.readThriftMethod(request.data) === 'fake') {
                        return next()

                    } else {
                        return Promise.reject(
                            new Error(`Unrecognized method name: ${thrift.readThriftMethod(request.data)}`),
                        )
                    }
                },
            }, {
                methods: ['addWithContext'],
                handler(request: IThriftRequest<void>, next: NextFunction<void>): Promise<IRequestResponse> {
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
        let connection: TcpConnection<IMetadata>
        let client: Calculator.Client<IMetadata>
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
                ThriftContextFilter<IMetadata, IMetadata>({
                    RequestCodec: MetadataCodec,
                    ResponseCodec: MetadataCodec,
                }),
            )

            client = new Calculator.Client(connection)

            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    const meta: IMetadata = { traceId: 9 }
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                    const result = new Calculator.AddResult({ success: 89 })
                    result.write(output)
                    output.writeMessageEnd()
                    const data: Buffer = writer.flush()

                    appendThriftObject(meta, data, MetadataCodec).then((extended: Buffer) => {
                        socket.write(frameCodec.encode(extended))
                    })
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3, { traceId: 1, clientId: 2 }).then((response: number) => {
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
                ThriftContextFilter<IMetadata, IMetadata>({
                    RequestCodec: MetadataCodec,
                    ResponseCodec: MetadataCodec,
                }),
            )

            client = new Calculator.Client(connection)

            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    const writer: thrift.TTransport = new thrift.BufferedTransport()
                    const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                    output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                    const result: Calculator.IAddResult = { success: 102 }
                    Calculator.AddResultCodec.encode(result, output)
                    output.writeMessageEnd()
                    const data: Buffer = writer.flush()

                    socket.write(frameCodec.encode(data))
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3, { traceId: 1, clientId: 2 }).then((response: number) => {
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
        let collectServer: IMockCollector
        let mockServer: net.Server

        before((done) => {
            connection = new TcpConnection({
                hostName: 'localhost',
                port: PORT,
            })

            connection.register(
                TTwitterClientFilter({
                    localServiceName: 'tcp-calculator-client',
                    remoteServiceName: 'calculator-service',
                    endpoint: 'http://localhost:9411/api/v1/spans',
                    sampleRate: 1,
                    httpInterval: 0,
                }),
            )

            client = new Calculator.Client(connection)

            mockCollector().then((collector: IMockCollector) => {
                collectServer = collector
                done()
            })
        })

        after((done) => {
            collectServer.close().then(() => {
                mockServer.close(() => {
                    console.log('TCP server closed')
                    mockServer.unref()
                    connection.destory().then(() => {
                        console.log('Connection destroyed')
                        done()
                    })
                })
            })
        })

        it('should handle appending data to payload', (done) => {
            let count: number = 0
            mockServer = net.createServer((socket: net.Socket): void => {
                console.log('TCP server created')
                socket.addListener('data', (chunk: Buffer) => {
                    if (count < 1) {
                        count += 1
                        const upgradeResponse: TTwitter.IUpgradeReply = {}
                        const writer: thrift.TTransport = new thrift.BufferedTransport()
                        const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                        output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                        TTwitter.UpgradeReplyCodec.encode(upgradeResponse, output)
                        output.writeMessageEnd()
                        socket.write(frameCodec.encode(writer.flush()))

                    } else {
                        const responseHeader = new TTwitter.ResponseHeader({})
                        const writer: thrift.TTransport = new thrift.BufferedTransport()
                        const output: thrift.TProtocol = new thrift.BinaryProtocol(writer)
                        output.writeMessageBegin('add', thrift.MessageType.CALL, 1)
                        const result = new Calculator.AddResult({ success: 61 })
                        result.write(output)
                        output.writeMessageEnd()
                        const data: Buffer = writer.flush()

                        appendThriftObject(responseHeader, data, TTwitter.ResponseHeaderCodec).then((extended: Buffer) => {
                            socket.write(frameCodec.encode(extended))
                        })
                    }
                })
            })

            mockServer.listen(PORT, () => {
                console.log(`TCP server listening on port: ${PORT}`)
                client.add(2, 3).then((response: number) => {
                    expect(response).to.equal(61)
                    done()
                }).catch((err: any) => {
                    console.log('err: ', err)
                    done(err)
                })
            })
        })
    })
})
