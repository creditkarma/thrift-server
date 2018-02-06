import {
    getProtocol,
    getTransport,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
    IHttpConnectionOptions,
    IIncomingMiddleware,
    IOutgoingMiddleware,
    OutgoingHandler,
    ThriftMiddleware,
    IThriftContext,
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
    incoming: Array<IIncomingMiddleware>
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

export interface IListenerData {
    handler: IEventListener
    oneTime: boolean
}

export type IEventListener = (...args: Array<any>) => void

export abstract class HttpConnection<Request = never, Options = never> extends ThriftConnection<Context> {
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
        this.path = normalizePath(options.path)
        this.protocol = ((options.https === true) ? 'https' : 'http')
        this.url = `${this.protocol}://${this.hostName}:${this.port}${this.path}`
        this.middleware = {
            incoming: [],
            outgoing: [],
        }
    }

    // Provides an empty context for outgoing middleware
    public abstract emptyContext(): IThriftContext<Request, Options>

    public abstract write(dataToWrite: Buffer, options?: Options): Promise<Buffer>

    public register(...middleware: Array<ThriftMiddleware<Options>>): void {
        middleware.forEach((next: ThriftMiddleware<Options>) => {
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

    public send(
        dataToSend: Buffer,
        context: IThriftContext<Request, Options> = this.emptyContext(),
    ): Promise<Buffer> {
        const requestMethod: string = readThriftMethod(dataToSend, this.Transport, this.Protocol)

        return reducePromises(this.middleware.outgoing.filter((next: IOutgoingMiddleware<Context>) => {
            return (
                next.methods.length === 0 ||
                next.methods.indexOf(requestMethod) > -1
            )

        }).map((next: IOutgoingMiddleware<Context>): OutgoingHandler<Context> => {
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
