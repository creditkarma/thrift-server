import * as net from 'net'
import * as tls from 'tls'
import {
    TType,
    // TTransport,
    TProtocol,
    IThriftField,
    IProtocolConstructor,
    ITransportConstructor,
    InputBufferUnderrunError,
} from '@creditkarma/thrift-server-core'
import * as logger from '../logger'

export interface IConnectionConfig {
    port: number
    hostName: string
    timeout?: number
    auth?: {
        username: string
        password: string,
    }
    ca?: Array<string>
    https?: boolean
    rejectUnauthorized?: boolean
    tlsHostname?: string
}

const createSocket = (config: IConnectionConfig): Promise<tls.TLSSocket | net.Socket> => {
    return new Promise((resolve, reject) => {
        const timeoutHandler = () => {
            logger.log(`connection config: ${config.hostName}:${config.port}`)
            reject(new Error('Timed out connecting'))
        }
        const errorHandler = () => {
            logger.log(`connection config: ${config.hostName}:${config.port}`)
            reject(new Error('Error connecting'))
        }

        const socket: net.Socket = net.connect(config.port, config.hostName)
        socket.setTimeout(config.timeout || 5000)

        socket.once('connect', (): void => {
            socket.removeListener('error', errorHandler)
            socket.removeListener('timeout', timeoutHandler)
            resolve(socket)
        })

        socket.once('error', errorHandler)

        socket.once('timeout', timeoutHandler)
    })
}

export class Connection {
    private socket: tls.TLSSocket | net.Socket
    private _hasSession: boolean

    constructor(socket: tls.TLSSocket | net.Socket) {
        this._hasSession = false
        this.socket = socket
        this.initializeSocket()
    }

    public hasSession() {
        return this._hasSession
    }

    public async destroy() {
        this.socket.destroy()
    }

    public send(data: Buffer, Transport: ITransportConstructor, Protocol: IProtocolConstructor): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let buf: Buffer = Buffer.from([])

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
            const errorHandler = () => {
                removeHandlers()
                reject(new Error('Thrift connection error'))
            }

            const dataHandler = (chunk: Buffer) => {
                buf = Buffer.concat([ buf, chunk ])
                try {
                    const input: TProtocol = new Protocol(new Transport(buf))
                    input.readMessageBegin()
                    while (true) {
                        const ret: IThriftField = input.readFieldBegin()
                        const fieldType: TType = ret.fieldType
                        if (fieldType === TType.STOP) {
                            removeHandlers()
                            resolve(buf)
                            break
                        } else {
                            input.skip(fieldType)
                        }
                    }
                } catch (err) {
                    if (err instanceof InputBufferUnderrunError === false) {
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

            this.socket.write(data)
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

export const createConnection = (config: IConnectionConfig): Promise<Connection> =>
    createSocket(config).then((socket) => {
        return new Connection(socket)
    })
