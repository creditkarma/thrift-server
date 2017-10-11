import * as request from 'request'

import {
  HttpConnection,
} from './connection'

import {
  IHttpConnectionOptions,
} from './types'

export type RequestInstance =
  request.RequestAPI<request.Request, request.CoreOptions, request.OptionalUriUrl>

export class RequestConnection<TClient> extends HttpConnection<TClient> {
  private request: RequestInstance

  constructor(requestApi: RequestInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi.defaults({
      // Encoding needs to be explicitly set to null or the response body will be a string
      encoding: null,
      headers: {
        Connection: 'keep-alive',
      },
      url: `http://${this.hostName}:${this.port}`,
    })
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.request
        .post({
          body: dataToWrite,
          headers: {
            'Content-length': dataToWrite.length,
          },
        }, (err: any, response: request.RequestResponse, body: Buffer) => {
          if (err !== null) {
            reject(err)
          } else {
            resolve(body)
          }
        })
    })
  }
}
