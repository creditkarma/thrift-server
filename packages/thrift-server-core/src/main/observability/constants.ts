export const L5D_TRACE_HDR: string = 'l5d-ctx-trace'

const B3Prefix: string = 'x-b3'
export const B3_TRACE_HDR: string = `${B3Prefix}-traceid`
export const B3_SPAN_HDR: string = `${B3Prefix}-spanid`
export const B3_PARENT_SPAN_HDR: string = `${B3Prefix}-parentspanid`
export const B3_SAMPLED_HDR: string = `${B3Prefix}-sampled`
export const B3_FLAGS_HDR: string = `${B3Prefix}-flags`
