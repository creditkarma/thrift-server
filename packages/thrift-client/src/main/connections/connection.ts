import {
  getProtocol,
  getTransport,
  InputBufferUnderrunError,
  IProtocolConstructor,
  IThriftMessage,
  ITransportConstructor,
  TApplicationException,
  TApplicationExceptionType,
  TProtocol,
  TTransport,
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

export abstract class HttpConnection<TClient, Context = never> {
  public Transport: ITransportConstructor
  public Protocol: IProtocolConstructor
  protected port: number
  protected hostName: string
  protected path: string
  protected protocol: HttpProtocol
  private client: TClient

  constructor(options: IHttpConnectionOptions) {
    this.port = options.port
    this.hostName = options.hostName
    this.path = normalizePath(options.path)
    this.Transport = getTransport(options.transport)
    this.Protocol = getProtocol(options.protocol)
    this.protocol = ((options.https === true) ? 'https' : 'http')
  }

  public abstract write(dataToWrite: Buffer, context?: Context): Promise<Buffer>

  public setClient(client: TClient): void {
    this.client = client
  }

  public send(dataToSend: Buffer, requestId: number, context?: Context): void {
    const requestCallback: any = (this.client as any)._reqs[requestId]
    this.write(dataToSend, context).then((returnValue: Buffer) => {
      const reader: TTransport = this.Transport.receiver(returnValue)
      const proto: TProtocol = new this.Protocol(reader)

      try {
        const { fieldName, messageType }: IThriftMessage = proto.readMessageBegin()

        if (typeof (this.client as any)[`recv_${fieldName}`] === 'function') {
          (this.client as any)[`recv_${fieldName}`](proto, messageType, requestId)
        } else {
          requestCallback(new TApplicationException(
            TApplicationExceptionType.WRONG_METHOD_NAME,
            `Received a response to an unknown RPC function: ${fieldName}`,
          ), undefined)
        }
      } catch (err) {
        if (err instanceof InputBufferUnderrunError) {
          reader.rollbackPosition()
        } else {
          requestCallback(err, undefined)
        }
      }
    }, (err: any) => {
      requestCallback(err, undefined)
    })
  }
}
