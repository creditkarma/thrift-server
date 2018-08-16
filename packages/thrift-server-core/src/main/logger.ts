export const log = (msg: string, data?: any) => {
    if (data !== undefined && process.env.DUBUG === 'true') {
        console.log(`[thrift-server-core:info] ${msg}`, data)
    } else if (process.env.DUBUG === 'true') {
        console.log(`[thrift-server-core:info] ${msg}`)
    }
}

export const warn = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.warn(`[thrift-server-core:warn] ${msg}`, data)
    } else {
        console.warn(`[thrift-server-core:warn] ${msg}`)
    }
}

export const error = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.error(`[thrift-server-core:error] ${msg}`, data)
    } else {
        console.error(`[thrift-server-core:error] ${msg}`)
    }
}
