export interface ITraceId {
    spanId: string
    parentId: string
    traceId: string
    sampled?: boolean
    traceIdHigh?: boolean
}

export interface IHeaderMap {
    [name: string]: string | Array<string> | undefined
}
