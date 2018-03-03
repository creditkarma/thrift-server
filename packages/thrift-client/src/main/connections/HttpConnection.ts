import {
    getProtocol,
    getTransport,
    readThriftMethod,
    ThriftConnection,
} from '@creditkarma/thrift-server-core'

import {
    IHttpConnectionOptions,
    IRequestMiddleware,
    IRequestResponse,
    IResponseMiddleware,
    IThriftMiddleware,
    RequestHandler,
    ThriftMiddleware,
} from '../types'

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

function filterByMethod(method: string): (middleware: IThriftMiddleware) => boolean {
    return (middleware: IThriftMiddleware): boolean => {
        return (
            middleware.methods.length === 0 ||
            middleware.methods.indexOf(method) > -1
        )
    }
}

function getHandler<Context>(middleware: IRequestMiddleware<Context>): RequestHandler<Context> {
    return middleware.handler
}

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

    public abstract write(dataToWrite: Buffer, context?: Context): Promise<IRequestResponse>

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

        return reducePromises(
            this.handlersForMethod(requestMethod),
            context,
        ).then((resolvedContext: Context | undefined) => {
            return this.write(dataToSend, resolvedContext).then((res: IRequestResponse) => {
                return this.middleware.response
                    .filter(filterByMethod(requestMethod))
                    .reduce((acc: Promise<Buffer>, next: IResponseMiddleware): Promise<Buffer> => {
                        return acc.then(next.handler)
                    }, Promise.resolve(res.body))
            })
        })
    }

    private handlersForMethod(name: string): Array<IPromisedFunction<Context>> {
        return this.middleware.request
            .filter(filterByMethod(name))
            .map(getHandler)
    }
}

/**
 * interface NextFunction<Context> {
 *     (data?: Buffer, context?: IThriftContext<Context>): Promise<Buffer>
 * }
 *
 * interface RequestHandler<Context> {
 *     (data: Buffer, context: IThriftContext<Context>, next: NextFunction<Context>): Promise<Buffer>
 * }
 *
 *
 */
