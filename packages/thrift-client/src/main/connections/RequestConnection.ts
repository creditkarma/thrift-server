import * as request from 'request'
import {
  CoreOptions,
  OptionalUriUrl,
  Request,
  RequestAPI,
  RequestResponse,
  RequiredUriUrl,
} from 'request'

import {
  HttpConnection,
} from './HttpConnection'

import {
  IHttpConnectionOptions,
} from '../types'

import {
  deepMerge,
} from '../utils'

export type RequestInstance =
  RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class RequestConnection extends HttpConnection<CoreOptions> {
    private request: RequestAPI<Request, CoreOptions, OptionalUriUrl>

    constructor(requestApi: RequestInstance, options: IHttpConnectionOptions) {
        super(options)
        this.request = requestApi.defaults({
            // Encoding needs to be explicitly set to null or the response body will be a string
            encoding: null,
            url: `${this.protocol}://${this.hostName}:${this.port}${this.path}`,
        })
    }

    public emptyContext(): CoreOptions {
        return {}
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
            this.request.post(requestOptions, (err: any, response: RequestResponse, body: Buffer) => {
                if (err !== null) {
                    reject(err)

                } else if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
                    reject(response)

                } else {
                    resolve(body)
                }
            })
        })
    }
}
