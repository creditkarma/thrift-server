import * as express from 'express'

import {
    IThriftProcessor,
    IThriftServerOptions,
} from '@creditkarma/thrift-server-core'

export type IExpressServerOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
> = IThriftServerOptions<TProcessor, Context, express.Request>

export interface ICreateExpressServerOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
> {
    path?: string
    thriftOptions: IExpressServerOptions<TProcessor, Context>
}
