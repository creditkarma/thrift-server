import * as Hapi from 'hapi'

import {
    IThriftProcessor,
    IThriftServerOptions,
    ProtocolType,
    TransportType,
} from '@creditkarma/thrift-server-core'

export interface IServiceDetails {
    processor: IThriftProcessor<Hapi.Request>
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

export type HapiThriftOptions<TProcessor extends IThriftProcessor<Hapi.Request>> = IThriftServerOptions<Hapi.Request, TProcessor>

export interface IHapiPluginOptions<
    TProcessor extends IThriftProcessor<Hapi.Request>
> {
    path?: string
    vhost?: string
    route?: Hapi.RouteOptions
    thriftOptions: HapiThriftOptions<TProcessor>
}

export interface ICreateHapiServerOptions<
    TProcessor extends IThriftProcessor<Hapi.Request>
> extends IHapiPluginOptions<TProcessor> {
    port: number
}

export type ThriftHapiPlugin = Hapi.Plugin<void>
