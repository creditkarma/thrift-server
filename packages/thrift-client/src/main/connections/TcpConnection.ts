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
    IThriftTcpFilter,
    IThriftTcpFilterConfig,
    TcpRequestHandler,
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
    protected readonly filters: Array<IThriftTcpFilter<T>>
    private pool: GenericPool.Pool<Connection>

    constructor({
        hostName,
        port,
        timeout = 5000,
        transport = 'buffered',
        protocol = 'binary',
        tls,
        pool,
    }: IConnectionOptions) {
        super(
            getTransport(transport),
            getProtocol(protocol),
        )
        this.filters = []
        this.pool = createPool({
            port,
            hostName,
            timeout,
        }, (pool || {}))
    }

    public register(...filters: Array<IThriftTcpFilterConfig<T>>): void {
        filters.forEach((next: IThriftTcpFilterConfig<T>) => {
            this.filters.push({
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
        const handlers: Array<TcpRequestHandler<T>> = this.handlersForMethod(requestMethod)

        const applyHandlers = (
            currentData: Buffer,
            currentContext: TcpContext<T>,
            [ head, ...tail ]: Array<TcpRequestHandler<T>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(currentData, currentContext).catch((err: any) => {
                    return Promise.reject(err)
                })

            } else {
                return head(currentData, (currentContext as any), (nextData?: Buffer, nextContext?: T): Promise<IRequestResponse> => {
                    return applyHandlers((nextData || currentData), nextContext, tail).catch((err: any) => {
                        return Promise.reject(err)
                    })
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
        return this.pool.acquire().then((connection) => {
            return connection.send(dataToWrite, this.Transport, this.Protocol).then((response: Buffer) => {
                this.pool.release(connection)
                return {
                    statusCode: 200,
                    headers: {},
                    body: response,
                }
            }, (err: any) => {
                logger.error('Error sending Thrift request: ', err)
                this.pool.release(connection)
                return Promise.reject(err)
            })
        }, (err: any) => {
            logger.error(`Unable to acquire connection for client: `, err)
            throw new Error(`Unable to acquire connection for thrift client`)
        }) as any
    }

    private emptyContext(): void {
        return undefined
    }

    private handlersForMethod(name: string): Array<TcpRequestHandler<T>> {
        return this.filters
            .filter(filterByMethod(name))
            .map((filter: IThriftTcpFilter<T>) =>  getHandler(filter))
    }
}
