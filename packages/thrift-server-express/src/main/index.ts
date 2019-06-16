import { IThriftProcessor } from '@creditkarma/thrift-server-core'
import * as bodyParser from 'body-parser'
import * as express from 'express'

import { ThriftServerExpress } from './ThriftServerExpress'

import { ICreateExpressServerOptions } from './types'

export * from './ThriftServerExpress'
export * from './types'

export function createThriftServer<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
>(
    options: ICreateExpressServerOptions<TProcessor, Context>,
): express.Application {
    const app: express.Application = express()

    app.use(
        options.path || '/thrift',
        bodyParser.raw(),
        ThriftServerExpress<TProcessor, Context>(options.thriftOptions),
    )

    return app
}
