import {
    getProtocol,
    getTransport,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
    IHttpConnectionOptions,
    IRequestMiddleware,
    IResponseMiddleware,
    RequestHandler,
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
    response: Array<IResponseMiddleware>
    request: Array<IRequestMiddleware<Context>>
}

export type IPromisedFunction<T> = (val: T) => Promise<T>

async function reducePromises<T>(
    promises: Array<IPromisedFunction<T>>,
    initial: T,
): Promise<T> {
    if (promises.length === 0) {
        return initial

    } else {
        const [head, ...tail] = promises
        const nextValue: T = await head(initial)
        if (tail.length === 0) {
            return nextValue

        } else {
            return reducePromises(tail, nextValue)
        }
    }
}

export interface IListenerData {
    handler: IEventListener
    oneTime: boolean
}

export type IEventListener = (...args: Array<any>) => void

export abstract class HttpConnection<Context = never> extends ThriftConnection<Context> {
    protected readonly port: number
    protected readonly hostName: string
    protected readonly path: string
    protected readonly url: string
    protected readonly protocol: HttpProtocol
    protected readonly middleware: IMiddlewareMap<Context>

    constructor(options: IHttpConnectionOptions) {
        super(
            getTransport(options.transport),
            getProtocol(options.protocol),
        )
        this.port = options.port
        this.hostName = options.hostName
        this.path = normalizePath(options.path || '/thrift')
        this.protocol = ((options.https === true) ? 'https' : 'http')
        this.url = `${this.protocol}://${this.hostName}:${this.port}${this.path}`
        this.middleware = {
            response: [],
            request: [],
        }
    }

    // Provides an empty context for outgoing middleware
    public abstract emptyContext(): Context

    public abstract write(dataToWrite: Buffer, context?: Context): Promise<Buffer>

    public register(...middleware: Array<ThriftMiddleware<Context>>): void {
        middleware.forEach((next: ThriftMiddleware<Context>) => {
            switch (next.type) {
                case 'request':
                    return this.middleware.request.push({
                        type: 'request',
                        methods: next.methods || [],
                        handler: next.handler,
                    })

                default:
                    return this.middleware.response.push({
                        type: 'response',
                        methods: next.methods || [],
                        handler: next.handler,
                    })
            }
        })
    }

    public send(
        dataToSend: Buffer,
        context: Context = this.emptyContext(),
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)

        return reducePromises(this.middleware.request.filter((next: IRequestMiddleware<Context>) => {
            return (
                next.methods.length === 0 ||
                next.methods.indexOf(requestMethod) > -1
            )

        }).map((next: IRequestMiddleware<Context>): RequestHandler<Context> => {
            return next.handler

        }), context).then((resolvedContext: Context | undefined) => {
            return this.write(dataToSend, resolvedContext).then((data: Buffer) => {
                return this.middleware.response.filter((next: IResponseMiddleware) => {
                    return (
                        next.methods.length === 0 ||
                        next.methods.indexOf(requestMethod) > -1
                    )

                }).reduce((acc: Promise<Buffer>, next: IResponseMiddleware): Promise<Buffer> => {
                    return acc.then(next.handler)
                }, Promise.resolve(data))
            })
        })
    }
}
