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
    IRequestResponse,
} from '../types'

import {
    deepMerge,
} from '../utils'

export type RequestInstance =
    RequestAPI<Request, CoreOptions, RequiredUriUrl>

export class RequestConnection extends HttpConnection<CoreOptions> {
    private readonly request: RequestAPI<Request, CoreOptions, RequiredUriUrl>

    constructor(request: RequestInstance, options: IHttpConnectionOptions) {
        super(options)
        this.request = request
    }

    public emptyContext(): CoreOptions {
        return {}
    }

    public write(dataToWrite: Buffer, options: CoreOptions = {}): Promise<IRequestResponse> {
        // Merge user options with required options
        const requestOptions: CoreOptions & UrlOptions = deepMerge(options, {
            method: 'POST',
            body: dataToWrite,
            encoding: null, // Needs to be explicitly set to null to get Buffer in response body
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
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body,
                    })
                }
            })
        })
    }
}
