import * as Core from '@creditkarma/thrift-server-core'

import * as express from 'express'

import { IExpressServerOptions } from './types'

// Extend Express types with our plugin
declare module 'express' {
    // tslint:disable-next-line:interface-name
    export interface Request {
        thrift?: {
            requestMethod: string
            processor: Core.IThriftProcessor<express.Request>
            transport: Core.TransportType
            protocol: Core.ProtocolType
        }
    }
}

export function ThriftServerExpress<
    TProcessor extends Core.IThriftProcessor<express.Request>
>(pluginOptions: IExpressServerOptions<TProcessor>): express.RequestHandler {
    return (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction,
    ): void => {
        const Transport: Core.ITransportConstructor = Core.getTransport(
            pluginOptions.transport,
        )
        const Protocol: Core.IProtocolConstructor = Core.getProtocol(
            pluginOptions.protocol,
        )
        const buffer: Buffer = request.body

        const method: string = Core.readThriftMethod(
            buffer,
            Transport,
            Protocol,
        )

        request.thrift = {
            requestMethod: method,
            processor: pluginOptions.handler,
            transport: pluginOptions.transport || 'buffered',
            protocol: pluginOptions.protocol || 'binary',
        }

        try {
            Core.process({
                processor: pluginOptions.handler,
                buffer,
                Transport,
                Protocol,
                context: request,
            }).then(
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
