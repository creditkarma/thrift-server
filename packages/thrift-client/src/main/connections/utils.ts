import {
    IThriftMiddleware,
    RequestHandler,
} from '../types'

export const normalizePath = (path: string = '/'): string => {
    if (path.startsWith('/')) {
        return path

    } else {
        return `/${path}`
    }
}

export const filterByMethod = <Context>(method: string): (middleware: IThriftMiddleware<Context>) => boolean => {
    return (middleware: IThriftMiddleware<Context>): boolean => {
        return (
            middleware.methods.length === 0 ||
            middleware.methods.indexOf(method) > -1
        )
    }
}

export const getHandler = <Context>(middleware: IThriftMiddleware<Context>): RequestHandler<Context> => {
    return middleware.handler
}
