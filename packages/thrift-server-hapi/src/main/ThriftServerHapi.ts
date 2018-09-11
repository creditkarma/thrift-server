import * as Hapi from 'hapi'

import {
    getProtocol,
    getTransport,
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
    process,
    readThriftMethod,
} from '@creditkarma/thrift-server-core'

import {
    IHapiPluginOptions,
    IHapiServerOptions,
    ThriftHapiPlugin,
} from './types'

/**
 * Create the thrift plugin for Hapi
 *
 * @param pluginOptions
 */
export function ThriftServerHapi<TProcessor extends IThriftProcessor<Hapi.Request>>(
    pluginOptions: IHapiPluginOptions<TProcessor>,
): ThriftHapiPlugin {
    const options: IHapiServerOptions<TProcessor> = pluginOptions.thriftOptions

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
            (server.plugins as any).thrift = {
                services: {
                    [pluginOptions.thriftOptions.serviceName]: {
                        processor: pluginOptions.thriftOptions.handler,
                        transport: options.transport || 'buffered',
                        protocol: options.protocol || 'binary',
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
