import { IThriftProcessor, LogFunction } from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'

import { ThriftServerHapi } from './ThriftServerHapi'

import { ICreateHapiServerOptions } from './types'

import { defaultLogger } from './logger'

export * from './ThriftServerHapi'
export * from './types'

/**
 * Creates and returns a Hapi server with the thrift plugin registered.
 *
 * @param options
 */
export function createThriftServer<
    TProcessor extends IThriftProcessor<Hapi.Request>
>(options: ICreateHapiServerOptions<TProcessor>): Promise<Hapi.Server> {
    const server = new Hapi.Server({
        port: options.port,
        debug: { request: ['error'] },
    })

    const logger: LogFunction = options.thriftOptions.logger || defaultLogger

    return server
        .register({
            plugin: ThriftServerHapi<TProcessor>({
                path: options.path,
                thriftOptions: options.thriftOptions,
            }),
        })
        .then(() => {
            return server
        })
        .catch((err: any) => {
            logger(
                ['error', 'createThriftServer'],
                `Unable to create Thrift server. ${err.message}`,
            )
            throw err
        })
}
