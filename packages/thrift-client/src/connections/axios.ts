import {
  AxiosInstance,
  AxiosResponse,
} from 'axios'

import {
  HttpConnection,
  IHttpConnectionOptions,
} from './connection'

export class AxiosConnection<TClient> extends HttpConnection<TClient> {
  private request: AxiosInstance

  constructor(requestApi: AxiosInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi
    this.request.defaults.responseType = 'arraybuffer'
    this.request.defaults.baseURL = `http://${this.hostName}:${this.port}`
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    return this.request.post('/', dataToWrite).then((value: AxiosResponse) => {
      return Buffer.from(value.data)
    })
  }
}
