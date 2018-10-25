import { LogFunction } from './types'

export const makeLogger = (name: string): LogFunction => {
    return (tag: string, data?: string | object): void => {
        switch (tag) {
            case 'info':
                if (data !== undefined && process.env.DUBUG !== undefined) {
                    console.log(`[${name}:info] `, data)
                } else if (process.env.DUBUG !== undefined) {
                    console.log(`[${name}:info]`)
                }
                break
            case 'warn':
                if (data !== undefined) {
                    console.warn(`[${name}:warn] `, data)
                } else {
                    console.warn(`[${name}:warn]`)
                }
                break
            case 'error':
                if (data !== undefined) {
                    console.error(`[${name}:error] `, data)
                } else {
                    console.error(`[${name}:error]`)
                }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
