import {
    IRequestResponse,
    IThriftClientFilterConfig,
    IThriftRequest,
    NextFunction,
} from '@creditkarma/thrift-client'

import { LogFunction } from '@creditkarma/thrift-server-core'
import { defaultLogger } from './logger'

function getStartTime(): [number, number] {
    return process.hrtime()
}

function getTimings(startTime: [number, number]): number {
    const duration = process.hrtime(startTime)
    return duration[0] * 1e3 + duration[1] * 1e-6 // In ms
}

interface ITimingOptions {
    logger: LogFunction
    methodName: string
    max
}

interface IStatusCount {
    error: number
    success: number
}

function logTimings({
    logger,
    methodName,
    duration,
    status,
}: ITimingOptions) {
    logger(['metrics', 'RequestDuration', methodName], {
        status,
        milliseconds: duration,
    })
}

export function ThriftClientTimingFilter<RequestContext>(
    logger: LogFunction = defaultLogger,
): IThriftClientFilterConfig<RequestContext> {
    const maxTime: number = 0
    let total: number = 0
    let count: number = 0
    const status: IStatusCount = {
        success: 0,
        error: 0,
    }
    return {
        handler(
            request: IThriftRequest<RequestContext>,
            next: NextFunction<RequestContext>,
        ): Promise<IRequestResponse> {
            const startTime = getStartTime()
            return next()
                .then((res: IRequestResponse) => {
                    logTimings(
                        logger,
                        request.methodName,
                        getTimings(startTime),
                        'success',
                    )
                    return res
                })
                .catch((err) => {
                    logTimings(
                        logger,
                        request.methodName,
                        getTimings(startTime),
                        'error',
                    )
                    return Promise.reject(err)
                })
        },
    }
}
