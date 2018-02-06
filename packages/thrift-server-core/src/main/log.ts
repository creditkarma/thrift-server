export function log(msg: string, data?: any): void {
    console.log(msg, data)
}

export function warning(msg: string, data?: any): void {
    console.warn(msg, data)
}

export function error(msg: string, data?: any): void {
    console.error(msg, data)
}
