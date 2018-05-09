import * as GenericPool from 'generic-pool'

import {
    getProtocol,
    getTransport,
    readThriftMethod,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
    IConnectionOptions,
    IRequestResponse,
    IThriftMiddleware,
    IThriftMiddlewareConfig,
    RequestHandler,
} from '../types'

import {
    Connection,
} from './Connection'

import {
    createPool,
} from './pool'

import {
    deepMerge,
} from '../utils'

import * as logger from '../logger'

import {
    filterByMethod,
    getHandler,
} from './utils'

export class TcpConnection extends ThriftConnection<void> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly middleware: Array<IThriftMiddleware<void>>

    private pool: GenericPool.Pool<Connection>
    // private offlineQueue: Array<Buffer> = []

    constructor(options: IConnectionOptions) {
        super(
            getTransport(options.transport),
            getProtocol(options.protocol),
        )
        this.port = options.port
        this.hostName = options.hostName
        this.middleware = []
        this.pool = createPool(options, {})
    }

    public register(...middleware: Array<IThriftMiddlewareConfig<void>>): void {
        middleware.forEach((next: IThriftMiddlewareConfig<void>) => {
            this.middleware.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: void = this.emptyContext(),
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)
        const handlers: Array<RequestHandler<void>> = this.handlersForMethod(requestMethod)

        const applyHandlers = (
            data: Buffer,
            currentContext: void,
            [ head, ...tail ]: Array<RequestHandler<void>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(data, currentContext)

            } else {
                return head(data, currentContext, (nextData?: Buffer, nextContext?: void): Promise<IRequestResponse> => {
                    const resolvedContext = deepMerge(currentContext, (nextContext || {}))
                    return applyHandlers((nextData || data), resolvedContext, tail)
                })
            }
        }

        return applyHandlers(dataToSend, context, handlers).then((res: IRequestResponse) => {
            return res.body
        })
    }

    public emptyContext(): void {
        return undefined
    }

    public write(dataToWrite: Buffer, options?: void): Promise<IRequestResponse> {
        return this.pool.acquire().then((connection) => {
            return connection.send(dataToWrite).then((response: Buffer) => {
                return {
                    statusCode: 200,
                    headers: {},
                    body: response,
                }
            })

        }, (err: any) => {
            logger.error(`Unable to acquire connection for client: `, err)
            throw new Error(`Unable to acquire connection for thrift client`)
        }) as any
    }

    private handlersForMethod(name: string): Array < RequestHandler < void >> {
        return this.middleware
            .filter(filterByMethod(name))
            .map(getHandler)
    }
}
