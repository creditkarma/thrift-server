import * as request from 'request'

import {
  IHttpConnection,
  IHttpConnectionOptions,
} from './types'

export type RequestClientApi =
  request.RequestAPI<request.Request, request.CoreOptions, request.OptionalUriUrl>

export class RequestConnection implements IHttpConnection {
  private request: RequestClientApi
  constructor(requestApi: RequestClientApi, options: IHttpConnectionOptions) {
    this.request = requestApi.defaults({
      // Encoding needs to be explicitly set to null or the response body will be a string
      encoding: null,
      headers: {
        Connection: 'keep-alive',
      },
      url: `http://${options.hostName}:${options.port}`,
    })
  }

  public write(dataToWrite: Buffer): Promise<Buffer> {
    const combinedBufferLength: number = 0
    const responseData: Buffer[] = []
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

export function createConnection(requestApi: RequestClientApi, options: IHttpConnectionOptions): IHttpConnection {
  return new RequestConnection(requestApi, options)
}
