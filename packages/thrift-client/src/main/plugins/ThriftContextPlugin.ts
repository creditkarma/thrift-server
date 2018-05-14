import {
    IStructConstructor,
    ProtocolType,
    StructLike,
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

import * as logger from '../logger'

export function ThriftContextPlugin<T extends StructLike>(
    ContextClass: IStructConstructor<T>,
    transportType: TransportType = 'buffered',
    protocolType: ProtocolType = 'binary',
): IThriftMiddlewareConfig<T> {
    return {
        handler(data: Buffer, context: T, next: NextFunction<T>): Promise<IRequestResponse> {
            return appendThriftObject(context, data, transportType, protocolType).then((extended: Buffer) => {
                return next().then((res: IRequestResponse): Promise<IRequestResponse> => {
                    return readThriftObject(res.body, ContextClass, transportType, protocolType).then((result: [T, Buffer]) => {
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
