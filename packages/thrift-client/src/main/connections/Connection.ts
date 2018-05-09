import * as net from 'net'
import * as tls from 'tls'
import * as logger from '../logger'

export interface IConnectionConfig {
    port: number
    hostName: string
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
        const socket: net.Socket = net.connect(config.port, config.hostName)
        socket.once('connect', (): void => {
            resolve(socket)
        })

        socket.once('error', (err: Error): void => {
            logger.log(`connection config: ${config.hostName}:${config.port}`)
            reject(new Error('Error connecting'))
        })

        socket.once('timeout', (): void => {
            logger.log(`connection config: ${config.hostName}:${config.port}`)
            reject(new Error('Timed out connecting'))
        })
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

    public send(data: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // const responses: Array<string> = []
            const timeoutHandler = () => {
                reject(new Error('Thrift connection timed out'))
            }
            const endHandler = () => {
                reject(new Error('Thrift connection ended'))
            }
            const errorHandler = () => {
                reject(new Error('Thrift connection error'))
            }

            // Listen for incoming responses
            this.socket.on('data', (chunk: Buffer) => {
                resolve(chunk)
            })

            // Make sure to reject the promise on errors
            this.socket.once('end', endHandler)
            this.socket.once('error', errorHandler)
            this.socket.once('timeout', timeoutHandler)

            // Inject command ID
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
