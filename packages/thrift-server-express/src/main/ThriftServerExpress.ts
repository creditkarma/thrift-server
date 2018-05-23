import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    IThriftServerOptions,
    ITransportConstructor,
    process,
} from '@creditkarma/thrift-server-core'

import * as bodyParser from 'body-parser'
import * as express from 'express'

import { ICreateExpressServerOptions } from './types'

export function createThriftServer<TProcessor extends IThriftProcessor<express.Request>>(
    options: ICreateExpressServerOptions<TProcessor>,
): express.Application {
    const app: express.Application = express()

    app.use(
        options.path || '/thrift',
        bodyParser.raw(),
        ThriftServerExpress<TProcessor>(options.thriftOptions),
    )

    return app
}

export function ThriftServerExpress<TProcessor extends IThriftProcessor<express.Request>>(
    pluginOptions: IThriftServerOptions<TProcessor>,
): express.RequestHandler {
    return (request: express.Request, response: express.Response, next: express.NextFunction): void => {
        const Transport: ITransportConstructor = getTransport(pluginOptions.transport)
        const Protocol: IProtocolConstructor = getProtocol(pluginOptions.protocol)

        try {
            process({
                processor: pluginOptions.handler,
                buffer: request.body,
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
