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

export type ExpressOptionsFunction<TProcessor> =
    (req?: express.Request, res?: express.Response) => IThriftServerOptions<TProcessor>

export interface ICreateExpressServerOptions<TProcessor> {
    path?: string
    thriftOptions: IThriftServerOptions<TProcessor>
}

export function createThriftServer<TProcessor extends IThriftProcessor<express.Request>>(
    options: ICreateExpressServerOptions<TProcessor>,
): express.Application {
    const app: express.Application = express()

    app.use(
        options.path || '/thrift',
        bodyParser.raw(),
        thriftServerExpress<TProcessor>(options.thriftOptions),
    )

    return app
}

function getPluginOptions<TProcessor>(
    request: express.Request,
    response: express.Response,
    options: IThriftServerOptions<TProcessor> | ExpressOptionsFunction<TProcessor>,
): IThriftServerOptions<TProcessor> {
    if (typeof options === 'function') {
        return options(request, response)
    } else {
        return options
    }
}

export function thriftServerExpress<TProcessor extends IThriftProcessor<express.Request>>(
    pluginOptions: IThriftServerOptions<TProcessor> | ExpressOptionsFunction<TProcessor>,
): express.RequestHandler {
    return (request: express.Request, response: express.Response, next: express.NextFunction): void => {
        const options = getPluginOptions(request, response, pluginOptions)
        const Transport: ITransportConstructor = getTransport(options.transport)
        const Protocol: IProtocolConstructor = getProtocol(options.protocol)

        try {
            process({
                processor: options.handler,
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
