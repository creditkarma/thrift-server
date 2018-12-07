import {
    IStructCodec,
    LogFunction,
    ProtocolType,
    TransportType,
    appendThriftObject,
    readThriftObject,
} from '@creditkarma/thrift-server-core'

import {
    IRequestResponse,
    IThriftClientFilterConfig,
    IThriftRequest,
    NextFunction,
} from '@creditkarma/thrift-client'

import { defaultLogger } from './logger'

export interface IThriftContextOptions<RequestContext, ResponseContext> {
    RequestCodec: IStructCodec<RequestContext, any>
    ResponseCodec: IStructCodec<ResponseContext, any>
    transportType?: TransportType
    protocolType?: ProtocolType
    logger?: LogFunction
}

export function ThriftClientContextFilter<RequestContext, ResponseContext>({
    RequestCodec,
    ResponseCodec,
    transportType = 'buffered',
    protocolType = 'binary',
    logger = defaultLogger,
}: IThriftContextOptions<
    RequestContext,
    ResponseContext
>): IThriftClientFilterConfig<RequestContext> {
    return {
        handler(
            request: IThriftRequest<RequestContext>,
            next: NextFunction<RequestContext>,
        ): Promise<IRequestResponse> {
            return appendThriftObject(
                request.context,
                request.data,
                RequestCodec,
                transportType,
                protocolType,
            ).then((extended: Buffer) => {
                return next(extended, request.context).then(
                    (response: IRequestResponse): Promise<IRequestResponse> => {
                        return readThriftObject(
                            response.body,
                            ResponseCodec,
                            transportType,
                            protocolType,
                        ).then(
                            (result: [any, Buffer]): IRequestResponse => {
                                return {
                                    statusCode: response.statusCode,
                                    headers: {
                                        thriftContext: result[0],
                                    },
                                    body: result[1],
                                }
                            },
                            (err: any) => {
                                logger(
                                    ['warn', 'ThriftClientContextFilter'],
                                    `Error reading context from Thrift response: ${
                                        err.message
                                    }`,
                                )
                                return response
                            },
                        )
                    },
                )
            })
        },
    }
}
