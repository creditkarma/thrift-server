import {
    InputBufferUnderrunError,
    IProtocolConstructor,
    ITransportConstructor,
    LogFunction,
    ThriftFrameCodec,
    TProtocol,
    TTransport,
    TType,
} from '@creditkarma/thrift-server-core'

import * as net from 'net'
import * as tls from 'tls'
import { defaultLogger } from '../logger'

export interface IConnectionConfig {
    port: number
    hostName: string
    timeout?: number
    auth?: {
        username: string
        password: string
    }
    ca?: Array<string>
    https?: boolean
    rejectUnauthorized?: boolean
    tlsHostname?: string
}

const skipStruct = (
    buffer: Buffer,
    Transport: ITransportConstructor,
    Protocol: IProtocolConstructor,
): Buffer => {
    try {
        const transport: TTransport = new Transport(buffer)
        const input: TProtocol = new Protocol(transport)
        input.readStructBegin()
        while (true) {
            const ret = input.readFieldBegin()
            const fieldType = ret.fieldType
            if (fieldType === TType.STOP) {
                break
            } else {
                input.skip(fieldType)
                input.readFieldEnd()
            }
        }

        input.readStructEnd()
        return transport.remaining()
    } catch (err) {
        return buffer
    }
}

const createSocket = (
    config: IConnectionConfig,
    logger: LogFunction,
): Promise<tls.TLSSocket | net.Socket> => {
    return new Promise((resolve, reject) => {
        const removeHandlers = (): void => {
            socket.removeAllListeners()
        }
        const connectHandler = (): void => {
            logger(
                ['debug', 'Connection'],
                `Connected to: ${config.hostName}:${config.port}`,
            )
            removeHandlers()
            resolve(socket)
        }
        const timeoutHandler = (): void => {
            logger(
                ['error', 'Connection'],
                `Timed out connecting: ${config.hostName}:${config.port}`,
            )
            removeHandlers()
            socket.destroy()
            reject(new Error('Timed out connecting'))
        }
        const errorHandler = (err: Error): void => {
            logger(
                ['error', 'Connection'],
                `Error connecting: ${config.hostName}:${config.port}`,
            )
            removeHandlers()
            socket.destroy()
            reject(err)
        }

        const socket: net.Socket = new net.Socket()

        socket.setTimeout(config.timeout || 5000)

        socket.once('error', errorHandler)

        socket.once('timeout', timeoutHandler)

        socket.once('connect', connectHandler)

        socket.connect(config.port, config.hostName)
    })
}

export class Connection {
    protected logger: LogFunction
    private socket: tls.TLSSocket | net.Socket
    private frameCodec: ThriftFrameCodec
    private _hasSession: boolean

    constructor(socket: tls.TLSSocket | net.Socket, logger: LogFunction) {
        this._hasSession = false
        this.logger = logger
        this.socket = socket
        this.frameCodec = new ThriftFrameCodec()
        this.initializeSocket()
    }

    public hasSession() {
        return this._hasSession
    }

    public async destroy() {
        this.socket.destroy()
    }

    public send(
        dataToSend: Buffer,
        Transport: ITransportConstructor,
        Protocol: IProtocolConstructor,
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let saved: Buffer = Buffer.alloc(0)

            const removeHandlers = () => {
                this.socket.removeListener('data', dataHandler)
                this.socket.removeListener('end', endHandler)
                this.socket.removeListener('error', errorHandler)
                this.socket.removeListener('timeout', timeoutHandler)
            }

            const timeoutHandler = () => {
                removeHandlers()
                reject(new Error('Thrift connection timed out'))
            }
            const endHandler = () => {
                removeHandlers()
                reject(new Error('Thrift connection ended'))
            }
            const errorHandler = (err: Error) => {
                this.logger(
                    ['error', 'Connection', 'send'],
                    `Error sending data to thrift service: ${err.message}`,
                )
                removeHandlers()
                reject(new Error('Thrift connection error'))
            }

            const dataHandler = (chunk: Buffer) => {
                saved = Buffer.concat([saved, chunk])
                const buffer: Buffer = this.frameCodec.decode(saved)
                const stripped: Buffer = skipStruct(buffer, Transport, Protocol)

                try {
                    const input = new Protocol(new Transport(stripped))
                    input.readMessageBegin()
                    while (true) {
                        const ret = input.readFieldBegin()
                        const fieldType = ret.fieldType
                        if (fieldType === TType.STOP) {
                            removeHandlers()
                            resolve(buffer)
                            break
                        } else {
                            input.skip(fieldType)
                        }
                    }
                } catch (err) {
                    if (!(err instanceof InputBufferUnderrunError)) {
                        this.logger(
                            ['error', 'Connection', 'send', 'dataHandler'],
                            `Error reading data from connection: ${
                                err instanceof Error
                                    ? err.message
                                    : 'Unexpected error thrown'
                            }`,
                        )
                        removeHandlers()
                        reject(err)
                    }
                }
            }

            // Listen for incoming responses
            this.socket.on('data', dataHandler)

            // Make sure to reject the promise on errors
            this.socket.once('end', endHandler)
            this.socket.once('error', errorHandler)
            this.socket.once('timeout', timeoutHandler)

            this.socket.write(this.frameCodec.encode(dataToSend))
        })
    }

    private initializeSocket() {
        this.socket.on('close', () => {
            this._hasSession = false
        })

        this.socket.on('end', () => {
            this._hasSession = false
        })

        this.socket.on('timeout', () => {
            this.socket.end()
            this._hasSession = false
        })

        this._hasSession = true
    }
}

export const createConnection = (
    config: IConnectionConfig,
    logger: LogFunction = defaultLogger,
): Promise<Connection> =>
    createSocket(config, logger).then((socket) => {
        return new Connection(socket, logger)
    })
