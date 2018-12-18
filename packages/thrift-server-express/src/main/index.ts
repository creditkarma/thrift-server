import { IThriftProcessor } from '@creditkarma/thrift-server-core'
import * as bodyParser from 'body-parser'
import * as express from 'express'

import { ThriftServerExpress } from './ThriftServerExpress'

import { ICreateExpressServerOptions } from './types'

export * from './ThriftServerExpress'
export * from './types'

export function createThriftServer<
    TProcessor extends IThriftProcessor<express.Request>
>(options: ICreateExpressServerOptions<TProcessor>): express.Application {
    const app: express.Application = express()

    app.use(
        options.path || '/thrift',
        bodyParser.raw(),
        ThriftServerExpress<TProcessor>(options.thriftOptions),
    )

    return app
}
