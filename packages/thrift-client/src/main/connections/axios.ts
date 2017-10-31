import {
  AxiosInstance,
  AxiosResponse,
} from 'axios'

import {
  HttpConnection,
} from './connection'

import {
  IHttpConnectionOptions,
} from './types'

export class AxiosConnection<TClient> extends HttpConnection<TClient> {
  private request: AxiosInstance

  constructor(requestApi: AxiosInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi
    this.request.defaults.responseType = 'arraybuffer'
    this.request.defaults.baseURL = `http://${this.hostName}:${this.port}`
    this.request.defaults.headers = {
      'host': this.hostName,
      'connection': 'keep-alive',
      'content-type': 'application/octet-stream',
    }
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    return this.request.post(this.path, dataToWrite, {
      headers: {
        'content-length': dataToWrite.length,
      },
    }).then((value: AxiosResponse) => {
      return Buffer.from(value.data)
    })
  }
}
