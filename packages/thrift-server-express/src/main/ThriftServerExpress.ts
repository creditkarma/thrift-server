import * as Core from '@creditkarma/thrift-server-core'

import * as express from 'express'

import { IExpressServerOptions } from './types'

// Extend Express types with our plugin
declare module 'express' {
    // tslint:disable-next-line:interface-name
    export interface Request {
        thrift?: {
            requestMethod: string
            processor: Core.IThriftProcessor
            // transport: Core.TransportType
            // protocol: Core.ProtocolType
        }
    }
}

export function ThriftServerExpress<
    TProcessor extends Core.IThriftProcessor<Context>,
    Context extends object = {}
>(
    pluginOptions: IExpressServerOptions<TProcessor, Context>,
): express.RequestHandler {
    return (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction,
    ): void => {
        const metadata: Core.IReadResult = pluginOptions.handler.readRequest(
            request.body,
        )

        request.thrift = {
            requestMethod: metadata.methodName,
            processor: pluginOptions.handler,
            // transport: pluginOptions.transport || 'buffered',
            // protocol: pluginOptions.protocol || 'binary',
        }

        const logFactory: Core.LogFactory<express.Request> =
            pluginOptions.logFactory ||
            ((_: any) => {
                return (tags: Array<string>, data?: any) => {
                    console.log(`[${tags.join(',')}]: `, data)
                }
            })

        const contextFacotry =
            pluginOptions.contextFactory || ((_: express.Request) => ({}))

        const clientFactory: Core.ClientFactory =
            pluginOptions.clientFactory ||
            ((name: string, args?: any) => {
                throw new Error('Not implemented')
            })

        try {
            const buffer: Buffer = request.body as Buffer
            const context: any = contextFacotry(request)
            const mergedContext: Core.ThriftContext<Context> = Core.deepMerge(
                context,
                {
                    headers: request.headers,
                    log: logFactory(request),
                    getClient: clientFactory,
                },
            )
            pluginOptions.handler.process(buffer, mergedContext).then(
                (result: any) => {
                    response.status(200).end(result)
                },
                (err: any) => {
                    next(err)
                },
            )
        } catch (err) {
            next(err)
        }
    }
}
