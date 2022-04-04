import { LogFunction } from './types'

export const makeLogger = (name: string): LogFunction => {
    return (tags: ReadonlyArray<string>, data?: string | object): void => {
        const allTags: Array<string> = Array.from(new Set([name, ...tags]))
        if (allTags.indexOf('error') > -1) {
            if (data !== undefined) {
                console.error(`[${allTags.join(',')}] `, data)
            } else {
                console.error(`[${allTags.join(',')}]`)
            }
        } else if (allTags.indexOf('warn') > -1) {
            if (data !== undefined) {
                console.warn(`[${allTags.join(',')}] `, data)
            } else {
                console.warn(`[${allTags.join(',')}]`)
            }
        } else if (allTags.indexOf('info') > -1) {
            if (data !== undefined) {
                console.info(`[${allTags.join(',')}] `, data)
            } else {
                console.info(`[${allTags.join(',')}]`)
            }
        } else {
            if (data !== undefined && process.env.DUBUG !== undefined) {
                console.log(`[${allTags.join(',')}] `, data)
            } else if (process.env.DUBUG !== undefined) {
                console.log(`[${allTags.join(',')}]`)
            }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
