import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
    process,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

import * as bodyParser from 'body-parser'
import * as express from 'express'

export interface IPluginOptions<TProcessor> {
    serviceName: string
    handler: TProcessor
    path?: string
    transport?: TransportType
    protocol?: ProtocolType
}

export interface IThriftServerOptions<TProcessor> extends IPluginOptions<TProcessor> {
    port: number
}

export function createThriftServer<TProcessor extends IThriftProcessor<express.Request>>(
    options: IThriftServerOptions<TProcessor>,
): express.Application {
    const app: express.Application = express()

    app.use(
        '/thrift',
        bodyParser.raw(),
        thriftExpress<TProcessor>({
            serviceName: options.serviceName,
            handler: options.handler,
            path: options.path,
            transport: options.transport,
            protocol: options.protocol,
        }),
    )

    return app
}

export function thriftExpress<TProcessor extends IThriftProcessor<express.Request>>(
    pluginOptions: IPluginOptions<TProcessor>,
): express.RequestHandler {
    const Transport: ITransportConstructor = getTransport(pluginOptions.transport)
    const Protocol: IProtocolConstructor = getProtocol(pluginOptions.protocol)

    return (request: express.Request, response: express.Response, next: express.NextFunction): void => {
        try {
            process(pluginOptions.handler, request.body, Transport, Protocol, request).then((result: any) => {
                response.status(200).end(result)
            }, (err: any) => {
                next(err)
            })
        } catch (err) {
            next(err)
        }
    }
}
