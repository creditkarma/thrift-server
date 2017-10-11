import {
  Thrift,
  TMessage,
  TProtocol,
  TProtocolConstructor,
  TTransport,
  TTransportConstructor,
} from 'thrift'

import {
  getProtocol,
  getTransport,
} from '@creditkarma/thrift-server-core'

import {
  IHttpConnectionOptions,
} from './types'

const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

const noop = (): null => null

function createReader(Transport: TTransportConstructor, data: Buffer): TTransport {
  const reader: TTransport = new Transport(undefined, noop)
  // We need to ensure that we have enough room to write the incooming data
  if (data.length > (reader as any).inBuf.length) {
    const buf: Buffer = new Buffer(length);
    (reader as any).inBuf.copy(buf, 0, 0, (reader as any).writeCursor);
    (reader as any).inBuf = buf
  }
  data.copy((reader as any).inBuf, (reader as any).writeCursor, 0);
  (reader as any).writeCursor += data.length
  return reader
}

function readPath(path: string = '/'): string {
  if (path.startsWith('/')) {
    return path
  } else {
    return `/${path}`
  }
}

export abstract class HttpConnection<TClient> {
  public Transport: TTransportConstructor
  public Protocol: TProtocolConstructor
  protected port: number
  protected hostName: string
  protected path: string
  private client: TClient

  constructor(options: IHttpConnectionOptions) {
    this.port = options.port
    this.hostName = options.hostName
    this.path = readPath(options.path)
    this.Transport = getTransport(options.transport)
    this.Protocol = getProtocol(options.protocol)
  }

  public abstract write(dataToWrite: Buffer): Promise<Buffer>

  public setClient(client: TClient): void {
    this.client = client
  }

  public send(dataToSend: Buffer, requestId: number): void {
    const requestCallback = (this.client as any)._reqs[requestId]
    this.write(dataToSend).then((returnValue: Buffer) => {
      const reader: TTransport = createReader(this.Transport, returnValue)
      const proto: TProtocol = new this.Protocol(reader)

      try {
        const { fname, mtype }: TMessage = proto.readMessageBegin()

        if (typeof (this.client as any)[`recv_${fname}`] === 'function') {
          (this.client as any)[`recv_${fname}`](proto, mtype, requestId)
        } else {
          requestCallback(new Thrift.TApplicationException(
            Thrift.TApplicationExceptionType.WRONG_METHOD_NAME,
            `Received a response to an unknown RPC function: ${fname}`,
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
