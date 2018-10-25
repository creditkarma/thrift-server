import * as Hapi from 'hapi'

import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
    LogFunction,
    process,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    IHapiServerOptions,
    ThriftHapiPlugin,
} from './types'

import { defaultLogger } from './logger'

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const options: IHapiServerOptions<TProcessor> = pluginOptions.thriftOptions
    const logger: LogFunction = options.logger || defaultLogger

    const Transport: ITransportConstructor = getTransport(
        options.transport,
    )

    const Protocol: IProtocolConstructor = getProtocol(
        options.protocol,
    )

    return {
        name: require('../../package.json').name,
        version: require('../../package.json').version,
        multiple: true,
        async register(server: Hapi.Server, nothing: void): Promise<void> {
            if (
                (server.plugins as any).thrift !== undefined &&
                (
                    (server.plugins as any).thrift.transport !== (options.transport || 'buffered') ||
                    (server.plugins as any).thrift.protocol !== (options.protocol || 'binary')
                )
            ) {
                logger('error', `You are registering services with different transport/protocol combinations on the same Hapi.Server instance. You may experience unexpected behavior.`)
            }

            (server.plugins as any).thrift = {
                transport: options.transport || 'buffered',
                protocol: options.protocol || 'binary',
                services: {
                    [pluginOptions.thriftOptions.serviceName]: {
                        processor: pluginOptions.thriftOptions.handler,
                    },
                },
            }

            server.route({
                method: 'POST',
                path: pluginOptions.path || '/thrift',
                handler: (request: Hapi.Request, reply: Hapi.ResponseToolkit) => {
                    const buffer: Buffer = (request.payload as Buffer)

                    const method: string = readThriftMethod(
                        buffer,
                        Transport,
                        Protocol,
                    );

                    (request.plugins as any).thrift = {
                        requestMethod: method,
                    }

                    return process<Hapi.Request>({
                        processor: options.handler,
                        buffer,
                        Transport,
                        Protocol,
                        context: request,
                    })
                },
                options: {
                    payload: {
                        parse: false,
                    },
                    auth: pluginOptions.auth,
                },
            })
        },
    }
}
