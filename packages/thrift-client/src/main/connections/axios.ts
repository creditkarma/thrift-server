import {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

import {
  HttpConnection,
} from './connection'

import {
  IHttpConnectionOptions,
} from './types'

import {
  deepMerge,
} from '../utils'

export class AxiosConnection<TClient> extends HttpConnection<TClient, AxiosRequestConfig> {
  private request: AxiosInstance

  constructor(requestApi: AxiosInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi
    this.request.defaults.responseType = 'arraybuffer'
    this.request.defaults.baseURL = `${this.protocol}://${this.hostName}:${this.port}`
  }

  public write(dataToWrite: Buffer, context: AxiosRequestConfig = {}): Promise<Buffer> {
    // Merge user options with required options
    const requestOptions: AxiosRequestConfig = deepMerge(context, {
      headers: {
        'content-length': dataToWrite.length,
        'content-type': 'application/octet-stream',
      },
    })

    return this.request.post(
      this.path,
      dataToWrite,
      requestOptions,
    ).then((value: AxiosResponse) => {
      return Buffer.from(value.data)
    })
  }
}
