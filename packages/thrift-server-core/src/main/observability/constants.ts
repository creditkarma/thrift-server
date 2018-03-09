export const L5D_TRACE_HDR: string = 'l5d-ctx-trace'

const B3Prefix: string = 'x-b3'
export const ZipkinHeaders = {
    TraceId: `${B3Prefix}-traceid`,
    SpanId: `${B3Prefix}-spanid`,
    ParentId: `${B3Prefix}-parentspanid`,
    Sampled: `${B3Prefix}-sampled`,
    Flags: `${B3Prefix}-flags`,
}
