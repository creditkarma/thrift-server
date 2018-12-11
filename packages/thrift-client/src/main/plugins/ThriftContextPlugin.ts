import {
    IStructConstructor,
    ProtocolType,
    StructLike,
    TProtocol,
    TransportType,
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

import { defaultLogger as logger } from '../logger'

export interface IThriftContextOptions<RequestContext extends StructLike, ResponseContext extends StructLike> {
    RequestContextClass: IStructConstructor<RequestContext>
    ResponseContextClass?: IStructConstructor<ResponseContext>
    transportType?: TransportType
    protocolType?: ProtocolType
}

export class DefaultReponse implements StructLike {
    public static read(input: TProtocol): DefaultReponse {
        return new DefaultReponse()
    }
    constructor(args?: {}) {
        // Nothing to see here
    }
    public write(output: TProtocol): void {
        return
    }
}

export function ThriftContextPlugin<RequestContext extends StructLike, ResponseContext extends StructLike = DefaultReponse>({
    RequestContextClass,
    ResponseContextClass = DefaultReponse,
    transportType = 'buffered',
    protocolType = 'binary',
}: IThriftContextOptions<RequestContext, ResponseContext>): IThriftMiddlewareConfig<RequestContext> {
    return {
        handler(data: Buffer, context: RequestContext, next: NextFunction<RequestContext>): Promise<IRequestResponse> {
            return appendThriftObject(context, data, transportType, protocolType).then((extended: Buffer) => {
                return next(extended, context).then((res: IRequestResponse): Promise<IRequestResponse> => {
                    return readThriftObject(
                        res.body,
                        ResponseContextClass,
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
                        logger(['warn', 'ThriftContextPlugin'], `Error reading context from Thrift response: ${err.message}`)
                        return res
                    })
                })
            })
        },
    }
}
