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

import * as logger from '../logger'

import {
    filterByMethod,
    getHandler,
} from './utils'

export type TcpContext<T> = T | void

export class TcpConnection<T = void> extends ThriftConnection<TcpContext<T>> {
    protected readonly middleware: Array<IThriftMiddleware<T>>

    private pool: GenericPool.Pool<Connection>

    constructor(options: IConnectionOptions) {
        super(
            getTransport(options.transport),
            getProtocol(options.protocol),
        )
        this.middleware = []
        this.pool = createPool(options, (options.pool || {}))
    }

    public register(...middleware: Array<IThriftMiddlewareConfig<T>>): void {
        middleware.forEach((next: IThriftMiddlewareConfig<T>) => {
            this.middleware.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(
        dataToSend: Buffer,
        context: TcpContext<T> = this.emptyContext(),
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)
        const handlers: Array<RequestHandler<T>> = this.handlersForMethod(requestMethod)

        const applyHandlers = (
            data: Buffer,
            currentContext: TcpContext<T>,
            [ head, ...tail ]: Array<RequestHandler<T>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(data, currentContext)

            } else {
                return head(data, (currentContext as any), (nextData?: Buffer, nextContext?: T): Promise<IRequestResponse> => {
                    return applyHandlers((nextData || data), nextContext, tail)
                })
            }
        }

        return applyHandlers(dataToSend, context, handlers).then((res: IRequestResponse) => {
            return res.body
        })
    }

    public destory(): Promise<void> {
        logger.warn('Destroying TCP connection')
        return this.pool.drain().then(() => {
            return this.pool.clear()
        }) as any as Promise<void>
    }

    public write(dataToWrite: Buffer, options?: TcpContext<T>): Promise<IRequestResponse> {
        return this.pool.acquire().then(async (connection) => {
            try {
                const response: Buffer = await connection.send(dataToWrite, this.Transport, this.Protocol)
                return {
                    statusCode: 200,
                    headers: {},
                    body: response,
                }
            } finally {
                this.pool.release(connection)
            }
        }, (err: any) => {
            logger.error(`Unable to acquire connection for client: `, err)
            throw new Error(`Unable to acquire connection for thrift client`)
        }) as any
    }

    private emptyContext(): void {
        return undefined
    }

    private handlersForMethod(name: string): Array<RequestHandler<T>> {
        return this.middleware
            .filter(filterByMethod(name))
            .map(getHandler)
    }
}
