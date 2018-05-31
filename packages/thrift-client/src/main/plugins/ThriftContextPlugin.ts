import {
    ProtocolType,
    TransportType,
    IStructCodec,
} from '@creditkarma/thrift-server-core'

import {
    IRequestResponse,
    IThriftMiddlewareConfig,
    NextFunction,
} from '../types'

import {
    appendThriftObject,
} from './appendThriftObject'

import {
    readThriftObject,
} from './readThriftObject'

import * as logger from '../logger'

export interface IThriftContextOptions<RequestContext, ResponseContext> {
    RequestCodec: IStructCodec<RequestContext, any>
    ResponseCodec: IStructCodec<ResponseContext, any>
    transportType?: TransportType
    protocolType?: ProtocolType
}

export function ThriftContextPlugin<RequestContext, ResponseContext>({
    RequestCodec,
    ResponseCodec,
    transportType = 'buffered',
    protocolType = 'binary',
}: IThriftContextOptions<RequestContext, ResponseContext>): IThriftMiddlewareConfig<RequestContext> {
    return {
        handler(data: Buffer, context: RequestContext, next: NextFunction<RequestContext>): Promise<IRequestResponse> {
            return appendThriftObject(context, data, RequestCodec, transportType, protocolType).then((extended: Buffer) => {
                return next(extended, context).then((res: IRequestResponse): Promise<IRequestResponse> => {
                    return readThriftObject(
                        res.body,
                        ResponseCodec,
                        transportType,
                        protocolType,
                    ).then((result: [any, Buffer]): IRequestResponse => {
                        return {
                            statusCode: res.statusCode,
                            headers: {
                                thriftContext: result[0],
                            },
                            body: result[1],
                        }
                    }, (err: any) => {
                        logger.warn(`Error reading context from Thrift response: `, err)
                        return res
                    })
                })
            })
        },
    }
}
