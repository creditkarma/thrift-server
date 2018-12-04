import { LogFunction } from './types'

export const makeLogger = (
    name: string,
    ...defaultTags: Array<string>
): LogFunction => {
    return (tags: Array<string>, data?: string | object): void => {
        const completeTags = Array.from(
            new Set([name, ...tags, ...defaultTags]),
        )

        if (completeTags.indexOf('error') > -1) {
            if (data !== undefined) {
                console.error(
                    `[${completeTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else {
                console.error(`[${completeTags.join()}] `, Date.now())
            }
        } else if (completeTags.indexOf('warn') > -1) {
            if (data !== undefined) {
                console.warn(
                    `[${completeTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else {
                console.warn(`[${completeTags.join()}] `, Date.now())
            }
        } else {
            if (data !== undefined && process.env.DEBUG !== undefined) {
                console.log(
                    `[${completeTags.join()}] `,
                    `${JSON.stringify(data)} ${Date.now()}`,
                )
            } else if (process.env.DEBUG !== undefined) {
                console.log(`[${completeTags.join()}] `, Date.now())
            }
        }
    }
}

export const defaultLogger: LogFunction = makeLogger('thrift-server-core')
