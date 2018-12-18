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

interface ITimingUpdate {
    methodName: string
    duration: number
    status: 'error' | 'success'
}

interface IStatusCount {
    error: number
    success: number
}

export interface ITimingFilterOptions {
    remoteServiceName: string
    interval?: number
    logger?: LogFunction
    tags?: Array<string>
}

export interface IRequestsPerMethod {
    [name: string]: number
}

export function ThriftClientTimingFilter<RequestContext>({
    remoteServiceName,
    interval = 5000,
    logger = defaultLogger,
    tags = [],
}: ITimingFilterOptions): IThriftClientFilterConfig<RequestContext> {
    let maxTime: number = 0
    let totalTime: number = 0
    let count: number = 0
    const statusCount: IStatusCount = {
        success: 0,
        error: 0,
    }
    const requestsPerMethod: IRequestsPerMethod = {}

    function logTimings(): void {
        logger(['metrics', 'RequestDuration', remoteServiceName, ...tags], {
            status: statusCount,
            maxDuration: maxTime,
            averageTime: totalTime / count,
            requestsPerMethod,
        })
    }

    function updateData({ methodName, duration, status }: ITimingUpdate) {
        count += 1
        statusCount[status] += 1
        totalTime += duration

        if (requestsPerMethod[methodName] === undefined) {
            requestsPerMethod[methodName] = 0
        }

        requestsPerMethod[methodName] += 1

        if (duration > maxTime) {
            maxTime = duration
        }
    }

    function scheduleUpdate() {
        const timer = setTimeout(() => {
            logTimings()
            scheduleUpdate()
        }, interval)

        timer.unref()
    }

    scheduleUpdate()

    return {
        handler(
            request: IThriftRequest<RequestContext>,
            next: NextFunction<RequestContext>,
        ): Promise<IRequestResponse> {
            const startTime = getStartTime()
            return next()
                .then((res: IRequestResponse) => {
                    updateData({
                        methodName: request.methodName,
                        duration: getTimings(startTime),
                        status: 'success',
                    })

                    return res
                })
                .catch((err) => {
                    updateData({
                        methodName: request.methodName,
                        duration: getTimings(startTime),
                        status: 'error',
                    })

                    return Promise.reject(err)
                })
        },
    }
}
