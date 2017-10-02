import {
  TTransportConstructor,
  TProtocolConstructor,
  TBinaryProtocol,
  TBufferedTransport,
} from 'thrift'

import {
  AxiosInstance,
  AxiosResponse,
} from 'axios'

import {
  IHttpConnection,
  IHttpConnectionOptions,
} from './types'

export class AxiosConnection implements IHttpConnection {
  transport: TTransportConstructor
  protocol: TProtocolConstructor
  private request: AxiosInstance
  constructor(requestApi: AxiosInstance, options: IHttpConnectionOptions) {
    this.request = requestApi
    this.request.defaults.responseType = 'arraybuffer'
    this.request.defaults.baseURL = `http://${options.hostName}:${options.port}`
    this.transport = options.transport || TBufferedTransport
    this.protocol = options.protocol || TBinaryProtocol
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    return this.request.post('/', dataToWrite).then((value: AxiosResponse) => {
      return Buffer.from(value.data)
    })
  }
}

export function createAxiosConnection(requestApi: AxiosInstance, options: IHttpConnectionOptions): IHttpConnection {
  return new AxiosConnection(requestApi, options)
}
