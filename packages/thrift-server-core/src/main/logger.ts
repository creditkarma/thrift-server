import { LogFunction } from './types'

export const makeLogger = (
    name: string,
    ...defaultTags: Array<string>
): LogFunction => {
    return (tags: Array<string>, data?: string | object): void => {
        const allTags = Array.from(
            new Set([...tags, ...defaultTags]),
        )

        if (allTags.indexOf('error') > -1) {
            if (data !== undefined) {
                console.error(
                    `[${allTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else {
                console.error(`[${allTags.join()}] `, Date.now())
            }
        } else if (allTags.indexOf('warn') > -1) {
            if (data !== undefined) {
                console.warn(
                    `[${allTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else {
                console.warn(`[${allTags.join()}] `, Date.now())
            }
        } else {
            if (data !== undefined && process.env.DEBUG !== undefined) {
                console.log(
                    `[${allTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else if (process.env.DEBUG !== undefined) {
                console.log(`[${allTags.join()}] `, Date.now())
            }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
