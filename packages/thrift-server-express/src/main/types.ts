import * as express from 'express'

import {
    IThriftContext,
    IThriftProcessor,
    IThriftServerOptions,
} from '@creditkarma/thrift-server-core'

export interface IExpressContext extends IThriftContext {
    request: express.Request
}

export type IExpressServerOptions<
    TProcessor extends IThriftProcessor<IExpressContext>
> = IThriftServerOptions<TProcessor, IExpressContext, express.Request>

export interface ICreateExpressServerOptions<
    TProcessor extends IThriftProcessor<IExpressContext>
> {
    path?: string
    thriftOptions: IExpressServerOptions<TProcessor>
}
