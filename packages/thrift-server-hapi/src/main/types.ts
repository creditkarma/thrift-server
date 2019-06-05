import * as Hapi from '@hapi/hapi'

import {
    IThriftContext,
    IThriftProcessor,
    IThriftServerOptions,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

export interface IHapiContext extends IThriftContext {
    request: Hapi.Request
}

export interface IServiceDetails {
    processor: IThriftProcessor<IHapiContext>
}

export interface IServiceDetailMap {
    [serviceName: string]: IServerDetails
}

export interface IServerDetails {
    transport: TransportType
    protocol: ProtocolType
    services: IServiceDetailMap
}

export interface IHandlerOptions<TProcessor> {
    service: TProcessor
}

export type HapiThriftOptions<
    TProcessor extends IThriftProcessor<IHapiContext>
> = IThriftServerOptions<TProcessor, IHapiContext>

export interface IHapiPluginOptions<
    TProcessor extends IThriftProcessor<IHapiContext>
> {
    path?: string
    vhost?: string
    route?: Hapi.RouteOptions
    thriftOptions: HapiThriftOptions<TProcessor>
}

export interface ICreateHapiServerOptions<
    TProcessor extends IThriftProcessor<IHapiContext>
> extends IHapiPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin = Hapi.Plugin<void>
