import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
    process,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import * as express from 'express'

import {
    IExpressServerOptions,
} from './types'

type ThriftRequest =
    express.Request & {
        thrift?: {
            requestMethod: string
            processor: Function
            transport: string
            protocol: string
        }
    }

export function ThriftServerExpress<TProcessor extends IThriftProcessor<express.Request>>(
    pluginOptions: IExpressServerOptions<TProcessor>,
): express.RequestHandler {
    return (request: ThriftRequest, response: express.Response, next: express.NextFunction): void => {
        const Transport: ITransportConstructor = getTransport(pluginOptions.transport)
        const Protocol: IProtocolConstructor = getProtocol(pluginOptions.protocol)
        const buffer: Buffer = request.body

        const method: string = readThriftMethod(
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
            process({
                processor: pluginOptions.handler,
                buffer,
                Transport,
                Protocol,
                context: request,
            }).then((result: any) => {
                response.status(200).end(result)
            }, (err: any) => {
                next(err)
            })
        } catch (err) {
            next(err)
        }
    }
}
