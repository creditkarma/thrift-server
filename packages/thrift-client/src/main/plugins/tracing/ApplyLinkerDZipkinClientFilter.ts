import { CoreOptions } from 'request'

import {
    addL5Dheaders,
    hasL5DHeader,
    IRequestHeaders,
} from '@creditkarma/thrift-server-core'

import {
    IRequestResponse,
    IThriftMiddleware,
    NextFunction,
    ThriftContext,
} from '../../types'

function applyL5DHeaders(requestHeaders: IRequestHeaders, headers: IRequestHeaders): IRequestHeaders {
    if (hasL5DHeader(requestHeaders)) {
        return addL5Dheaders(headers)

    } else {
        return headers
    }
}

function readRequestHeaders(context: any): IRequestHeaders {
    if (context.request && context.request.headers) {
        return context.request.headers

    } else if (context.headers) {
        return context.headers

    } else {
        return {}
    }
}

export function ApplyLinkerDZipkinClientFilter(): IThriftMiddleware<CoreOptions> {
    return {
        methods: [],
        handler(data: Buffer, context: ThriftContext<CoreOptions>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            const requestHeaders = readRequestHeaders(context)
            const outgoingHeaders = (context.headers || {})

            return next(data, { headers: applyL5DHeaders(requestHeaders, outgoingHeaders) })
        },
    }
}
