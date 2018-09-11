import * as Hapi from 'hapi'

import {
    IThriftServerOptions,
} from '@creditkarma/thrift-server-core'

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export interface IHapiPluginOptions<TProcessor> {
    path?: string
    auth?: false | string | Hapi.RouteOptionsAccess
    thriftOptions: IThriftServerOptions<TProcessor>
}

export interface ICreateHapiServerOptions<TProcessor>
    extends IHapiPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin = Hapi.Plugin<void>
