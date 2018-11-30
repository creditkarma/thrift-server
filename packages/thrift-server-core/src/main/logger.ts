import { LogFunction } from './types'

export const makeLogger = (name: string): LogFunction => {
    return (tags: Array<string>, data?: string | object): void => {
        console.log('DEBUG: ', process.env.DEBUG)
        if (tags.indexOf('error') > -1) {
            if (data !== undefined) {
                console.error(`[${tags.join()}] `, JSON.stringify(data))
            } else {
                console.error(`[${name}:error]`)
            }
        } else if (tags.indexOf('warn') > -1) {
            if (data !== undefined) {
                console.warn(`[${tags.join()}] `, JSON.stringify(data))
            } else {
                console.warn(`[${name}:warn]`)
            }
        } else {
            if (data !== undefined && process.env.DEBUG !== undefined) {
                console.log(`[${tags.join()}] `, JSON.stringify(data))
            } else if (process.env.DEBUG !== undefined) {
                console.log(`[${name}:info]`)
            }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
