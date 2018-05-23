import {
    IThriftServerOptions,
} from '@creditkarma/thrift-server-core'

export interface ICreateExpressServerOptions<TProcessor> {
    path?: string
    thriftOptions: IThriftServerOptions<TProcessor>
}
