import * as Hapi from '@hapi/hapi'

import {
    IThriftProcessor,
    IThriftServerOptions,
} from '@creditkarma/thrift-server-core'

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export type HapiThriftOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
> = IThriftServerOptions<TProcessor, Context, Hapi.Request>

export interface IHapiPluginOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
> {
    path?: string
    vhost?: string
    route?: Hapi.RouteOptions
    thriftOptions: HapiThriftOptions<TProcessor, Context>
}

export interface ICreateHapiServerOptions<
    TProcessor extends IThriftProcessor<Context>,
    Context extends object = {}
> extends IHapiPluginOptions<TProcessor, Context> {
    port: number
}

export type ThriftHapiPlugin = Hapi.Plugin<void>
