import { IThriftProcessor } from '@creditkarma/thrift-server-core'
import * as Hapi from '@hapi/hapi'

import { ThriftServerHapi } from './ThriftServerHapi'

import { ICreateHapiServerOptions } from './types'

export * from './ThriftServerHapi'
export * from './types'
/**
 * Creates and returns a Hapi server with the thrift plugin registered.
 *
 * @param options
 */
export function createThriftServer<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
>(
    options: ICreateHapiServerOptions<TProcessor, Context>,
): Promise<Hapi.Server> {
    const server = new Hapi.Server({
        port: options.port,
        debug: { request: ['error'] },
    })

    return server
        .register({
            plugin: ThriftServerHapi<TProcessor, Context>({
                path: options.path,
                thriftOptions: options.thriftOptions,
            }),
        })
        .then(() => {
            return server
        })
        .catch((err: any) => {
            server.log(
                ['error', 'createThriftServer'],
                `Unable to create Thrift server. ${err.message}`,
            )
            throw err
        })
}
