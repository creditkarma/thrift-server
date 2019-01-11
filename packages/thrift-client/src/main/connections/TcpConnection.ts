import * as GenericPool from 'generic-pool'

import {
    getProtocol,
    getTransport,
    LogFunction,
    readThriftMethod,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
    IConnectionOptions,
    IRequestResponse,
    IThriftClientFilter,
    IThriftClientFilterConfig,
    IThriftRequest,
    RequestHandler,
} from '../types'

import { Connection } from './Connection'

import { createPool } from './pool'

import { defaultLogger } from '../logger'

import { filterByMethod } from './utils'

export class TcpConnection<Context = any> extends ThriftConnection<Context> {
    protected readonly filters: Array<IThriftClientFilter<Context>>
    protected readonly logger: LogFunction
    private pool: GenericPool.Pool<Connection>
    private hostName: string
    private port: number

    constructor({
        hostName,
        port,
        timeout = 5000,
        transport = 'buffered',
        protocol = 'binary',
        logger = defaultLogger,
        pool,
    }: IConnectionOptions) {
        super(getTransport(transport), getProtocol(protocol))
        this.hostName = hostName
        this.port = port
        this.filters = []
        this.logger = logger
        this.pool = createPool(
            {
                port,
                hostName,
                timeout,
            },
            this.logger,
            pool || {},
        )
    }

    public register(
        ...filters: Array<IThriftClientFilterConfig<Context>>
    ): void {
        filters.forEach((next: IThriftClientFilterConfig<Context>) => {
            this.filters.push({
                methods: next.methods || [],
                handler: next.handler,
            })
        })
    }

    public send(dataToSend: Buffer, context: any = {}): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(
            dataToSend,
            this.Transport,
            this.Protocol,
        )
        const handlers: Array<RequestHandler<Context>> = this.handlersForMethod(
            requestMethod,
        )
        const thriftRequest: IThriftRequest<Context> = {
            data: dataToSend,
            methodName: requestMethod,
            uri: `${this.hostName}:${this.port}`,
            context,
        }

        const applyHandlers = (
            currentRequest: IThriftRequest<Context>,
            [head, ...tail]: Array<RequestHandler<Context>>,
        ): Promise<IRequestResponse> => {
            if (head === undefined) {
                return this.write(
                    currentRequest.data,
                    currentRequest.context,
                ).catch((err: any) => {
                    return Promise.reject(err)
                })
            } else {
                return head(
                    currentRequest,
                    (
                        nextData?: Buffer,
                        nextContext?: Context,
                    ): Promise<IRequestResponse> => {
                        return applyHandlers(
                            {
                                data: nextData || currentRequest.data,
                                methodName: currentRequest.methodName,
                                uri: currentRequest.uri,
                                context: nextContext || currentRequest.context,
                            },
                            tail,
                        ).catch((err: any) => {
                            return Promise.reject(err)
                        })
                    },
                )
            }
        }

        return applyHandlers(thriftRequest, handlers).then(
            (res: IRequestResponse) => {
                return res.body
            },
        )
    }

    public destory(): Promise<void> {
        this.logger(['warn', 'TcpConnection'], 'Destroying TCP connection')
        return (this.pool.drain().then(() => {
            return this.pool.clear()
        }) as any) as Promise<void>
    }

    private write(
        dataToWrite: Buffer,
        options?: Context,
    ): Promise<IRequestResponse> {
        return this.pool.acquire().then(
            (connection) => {
                return connection
                    .send(dataToWrite, this.Transport, this.Protocol)
                    .then(
                        (response: Buffer) => {
                            this.pool.release(connection)
                            return {
                                statusCode: 200,
                                headers: {},
                                body: response,
                            }
                        },
                        (err: any) => {
                            this.logger(
                                ['error', 'TcpConnection'],
                                `Error sending Thrift request: ${err.message}`,
                            )
                            this.pool.release(connection)
                            return Promise.reject(err)
                        },
                    )
            },
            (err: any) => {
                this.logger(
                    ['error', 'TcpConnection'],
                    `Unable to acquire connection for client: ${err.message}`,
                )
                throw new Error(
                    `Unable to acquire connection for thrift client`,
                )
            },
        ) as any
    }

    private handlersForMethod(name: string): Array<RequestHandler<Context>> {
        return this.filters
            .filter(filterByMethod(name))
            .map((filter: IThriftClientFilter<Context>) => filter.handler)
    }
}
