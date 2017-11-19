import * as request from 'request'

import {
  HttpConnection,
} from './connection'

import {
  IHttpConnectionOptions,
} from './types'

import {
  deepMerge,
} from '../utils'

export type RequestInstance =
  request.RequestAPI<request.Request, request.CoreOptions, request.OptionalUriUrl>

export class RequestConnection<TClient> extends HttpConnection<TClient, request.CoreOptions> {
  private request: RequestInstance

  constructor(requestApi: RequestInstance, options: IHttpConnectionOptions) {
    super(options)
    this.request = requestApi.defaults({
      // Encoding needs to be explicitly set to null or the response body will be a string
      encoding: null,
      url: `http://${this.hostName}:${this.port}${this.path}`,
    })
  }

  public write(dataToWrite: Buffer, context: request.CoreOptions = {}): Promise<Buffer> {
    // Merge user options with required options
    const requestOptions: request.CoreOptions = deepMerge(context, {
      body: dataToWrite,
      headers: {
        'content-length': dataToWrite.length,
        'content-type': 'application/octet-stream',
      },
    })

    return new Promise((resolve, reject) => {
      this.request
        .post(requestOptions, (err: any, response: request.RequestResponse, body: Buffer) => {
          if (err !== null) {
            reject(err)
          } else if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
            reject(new Error(body.toString()))
          } else {
            resolve(body)
          }
        })
    })
  }
}
