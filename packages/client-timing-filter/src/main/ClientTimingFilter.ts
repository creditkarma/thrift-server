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

function logTimings(
    methodName: string,
    duration: number,
    status?: number | string,
    logger: LogFunction = defaultLogger,
) {
    console.log('logTimings: ', duration)
    logger(['metrics', 'RequestDuration', methodName], {
        status,
        milliseconds: duration,
    })
}

export function ClientTimingFilter<RequestContext>(
    logger?: LogFunction,
): IThriftClientFilterConfig<RequestContext> {
    return {
        handler(
            request: IThriftRequest<RequestContext>,
            next: NextFunction<RequestContext>,
        ): Promise<IRequestResponse> {
            const startTime = getStartTime()
            return next()
                .then((res: IRequestResponse) => {
                    logTimings(
                        request.methodName,
                        getTimings(startTime),
                        'success',
                        logger,
                    )
                    return res
                })
                .catch((err) => {
                    logTimings(
                        request.methodName,
                        getTimings(startTime),
                        'error',
                        logger,
                    )
                    return Promise.reject(err)
                })
        },
    }
}
