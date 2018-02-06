import {
  CoreOptions,
  Request,
  RequestAPI,
  RequestResponse,
  RequiredUriUrl,
  UrlOptions,
} from 'request'

import {
  HttpConnection,
} from './HttpConnection'

import {
  IHttpConnectionOptions,
  IThriftContext,
} from '../types'

import {
  deepMerge,
} from '../utils'

export type RequestInstance =
    RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class RequestConnection<Context> extends HttpConnection<Context, CoreOptions> {
    private readonly request: RequestAPI<Request, CoreOptions, RequiredUriUrl>

    constructor(request: RequestInstance, options: IHttpConnectionOptions) {
        super(options)
        this.request = request
    }

    public emptyContext(): IThriftContext<Context, CoreOptions> {
        return {}
    }

    public write(dataToWrite: Buffer, options: CoreOptions = {}): Promise<Buffer> {
        // Merge user options with required options
        const requestOptions: CoreOptions & UrlOptions = deepMerge(options, {
            method: 'POST',
            body: dataToWrite,
            encoding: null,
            url: this.url,
            headers: {
                'content-length': dataToWrite.length,
                'content-type': 'application/octet-stream',
            },
        })

        return new Promise((resolve, reject) => {
            this.request(requestOptions, (err: any, response: RequestResponse, body: Buffer) => {
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
