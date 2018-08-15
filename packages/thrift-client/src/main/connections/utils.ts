import {
    IThriftClientFilter,
    IThriftTcpFilter,
    RequestHandler,
    TcpRequestHandler,
} from '../types'

export const normalizePath = (path: string = '/'): string => {
    if (path.startsWith('/')) {
        return path

    } else {
        return `/${path}`
    }
}

export function filterByMethod<Context>(method: string): (filter: IThriftClientFilter<Context>) => boolean
export function filterByMethod<Context>(method: string): (filter: IThriftTcpFilter<Context>) => boolean
export function filterByMethod<Context>(method: string): (filter: any) => boolean {
    return (filter: any): boolean => {
        return (
            filter.methods.length === 0 ||
            filter.methods.indexOf(method) > -1
        )
    }
}

export function getHandler<Context>(filter: IThriftTcpFilter<Context>): TcpRequestHandler<Context>
export function getHandler<Context>(filter: IThriftClientFilter<Context>): RequestHandler<Context>
export function getHandler<Context>(filter: any): any {
    return filter.handler
}
