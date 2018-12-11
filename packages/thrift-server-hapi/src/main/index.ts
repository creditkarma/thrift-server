import { IThriftProcessor } from '@creditkarma/thrift-server-core'
import * as Hapi from 'hapi'

import {
    ThriftServerHapi,
} from './ThriftServerHapi'

import {
    ICreateHapiServerOptions,
} from './types'

import { defaultLogger as logger } from './logger'

export * from './observability'
export * from './ThriftServerHapi'
export * from './types'

/**
 * Creates and returns a Hapi server with the thrift plugin registered.
 *
 * @param options
 */
export function createThriftServer<TProcessor extends IThriftProcessor<Hapi.Request>>(
    options: ICreateHapiServerOptions<TProcessor>,
): Hapi.Server {
    const server = new Hapi.Server({ debug: { request: ['error'] } })
    server.connection({ port: options.port })

    server.register(
        ThriftServerHapi<TProcessor>({
            path: options.path,
            thriftOptions: options.thriftOptions,
        }),
        (err: any) => {
            if (err) {
                logger(['error', 'createThriftServer'], `There was an error registering thrift plugin: ${err.message}`)
                throw err
            }
        },
    )

    return server
}
