export const log = (msg: string, data?: any) => {
    if (data !== undefined && process.env.DUBUG !== undefined) {
        console.log(`[thrift-server-hapi:info] ${msg}`, data)
    } else if (process.env.DUBUG !== undefined) {
        console.log(`[thrift-server-hapi:info] ${msg}`)
    }
}

export const warn = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.warn(`[thrift-server-hapi:warn] ${msg}`, data)
    } else {
        console.warn(`[thrift-server-hapi:warn] ${msg}`)
    }
}

export const error = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.error(`[thrift-server-hapi:error] ${msg}`, data)
    } else {
        console.error(`[thrift-server-hapi:error] ${msg}`)
    }
}
