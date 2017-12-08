import {
  getProtocol,
  getTransport,
  IProtocolConstructor,
  IThriftConnection,
  ITransportConstructor,
} from '@creditkarma/thrift-server-core'

import {
  IHttpConnectionOptions,
} from './types'

function normalizePath(path: string = '/'): string {
  if (path.startsWith('/')) {
    return path
  } else {
    return `/${path}`
  }
}

export type HttpProtocol =
  'http' | 'https'

export abstract class HttpConnection<Context = never> implements IThriftConnection<Context> {
  public Transport: ITransportConstructor
  public Protocol: IProtocolConstructor
  protected port: number
  protected hostName: string
  protected path: string
  protected protocol: HttpProtocol

  constructor(options: IHttpConnectionOptions) {
    this.port = options.port
    this.hostName = options.hostName
    this.path = normalizePath(options.path)
    this.Transport = getTransport(options.transport)
    this.Protocol = getProtocol(options.protocol)
    this.protocol = ((options.https === true) ? 'https' : 'http')
  }

  public abstract write(dataToWrite: Buffer, context?: Context): Promise<Buffer>

  public send(dataToSend: Buffer, context?: Context): Promise<Buffer> {
    return this.write(dataToSend, context)
  }
}
