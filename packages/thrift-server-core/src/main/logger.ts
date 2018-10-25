import { LogFunction } from './types'

export const makeLogger = (name: string): LogFunction => {
    return (tags: Array<string>, data?: string | object): void => {
        if (tags.includes('error')) {
            if (data !== undefined) {
                console.error(`[${name}:error] `, data)
            } else {
                console.error(`[${name}:error]`)
            }
        } else if (tags.includes('warn')) {
            if (data !== undefined) {
                console.warn(`[${name}:warn] `, data)
            } else {
                console.warn(`[${name}:warn]`)
            }
        } else {
            if (data !== undefined && process.env.DUBUG !== 'true') {
                console.log(`[${name}:info] `, data)
            } else if (process.env.DUBUG !== undefined) {
                console.log(`[${name}:info]`)
            }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
