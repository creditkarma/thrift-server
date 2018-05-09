export const log = (msg: string, data?: any) => {
    if (data !== undefined && process.env.DUBUG !== undefined) {
        console.log(`[thrift-client:info] ${msg}`, data)
    } else if (process.env.DUBUG !== undefined) {
        console.log(`[thrift-client:info] ${msg}`)
    }
}

export const warn = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.warn(`[thrift-client:warn] ${msg}`, data)
    } else {
        console.warn(`[thrift-client:warn] ${msg}`)
    }
}

export const error = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.error(`[thrift-client:error] ${msg}`, data)
    } else {
        console.error(`[thrift-client:error] ${msg}`)
    }
}
