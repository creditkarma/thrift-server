import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftConnection,
    ITransportConstructor,
} from '@creditkarma/thrift-server-core'

import {
    IHttpConnectionOptions,
    IIncomingMiddleware,
    IOutgoingMiddleware,
    ThriftMiddleware,
} from '../types'

import {
    readThriftMethod,
} from '../utils'

function normalizePath(path: string = '/'): string {
    if (path.startsWith('/')) {
        return path
    } else {
        return `/${path}`
    }
}

export type HttpProtocol =
    'http' | 'https'

export interface IMiddlewareMap<Context> {
    incoming: IIncomingMiddleware[]
    outgoing: Array<IOutgoingMiddleware<Context>>
}

export type IPromisedFunction<T> = (val: T) => Promise<T>

async function reducePromises<T>(
    promises: Array<IPromisedFunction<T>>,
    initial: T,
): Promise<T> {
    if (promises.length === 0) {
        return initial
    } else {
        const [ head, ...tail ] = promises
        const nextValue: T = await head(initial)
        if (tail.length === 0) {
            return nextValue
        } else {
            return reducePromises(tail, nextValue)
        }
    }
}

export abstract class HttpConnection<Context = never> implements IThriftConnection<Context> {
    public Transport: ITransportConstructor
    public Protocol: IProtocolConstructor
    protected port: number
    protected hostName: string
    protected path: string
    protected protocol: HttpProtocol
    protected middleware: IMiddlewareMap<Context>

    constructor(options: IHttpConnectionOptions) {
        this.port = options.port
        this.hostName = options.hostName
        this.path = normalizePath(options.path)
        this.Transport = getTransport(options.transport)
        this.Protocol = getProtocol(options.protocol)
        this.protocol = ((options.https === true) ? 'https' : 'http')
        this.middleware = {
            incoming: [],
            outgoing: [],
        }
    }

    // Provides an empty context for outgoing middleware
    public abstract emptyContext(): Context

    public abstract write(dataToWrite: Buffer, context?: Context): Promise<Buffer>

    public register(...middleware: Array<ThriftMiddleware<Context>>): void {
        middleware.forEach((next: ThriftMiddleware<Context>) => {
            switch (next.type) {
                case 'outgoing':
                    return this.middleware.outgoing.push({
                        type: 'outgoing',
                        methods: next.methods || [],
                        handler: next.handler,
                    })

                default:
                    return this.middleware.incoming.push({
                        type: 'incoming',
                        methods: next.methods || [],
                        handler: next.handler,
                    })
            }
        })
    }

    public send(dataToSend: Buffer, context: Context = this.emptyContext()): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)

        return reducePromises(this.middleware.outgoing.filter((next: IOutgoingMiddleware<Context>) => {
            return (
                next.methods.length === 0 ||
                next.methods.indexOf(requestMethod) > -1
            )

        }).map((next: IOutgoingMiddleware<Context>) => {
            return next.handler

        }), context).then((resolvedContext: Context | undefined) => {
            return this.write(dataToSend, resolvedContext).then((data: Buffer) => {
                return this.middleware.incoming.filter((next: IIncomingMiddleware) => {
                    return (
                        next.methods.length === 0 ||
                        next.methods.indexOf(requestMethod) > -1
                    )
                }).reduce((acc: Promise<Buffer>, next: IIncomingMiddleware): Promise<Buffer> => {
                    return acc.then(next.handler)
                }, Promise.resolve(data))
            })
        })
    }
}
