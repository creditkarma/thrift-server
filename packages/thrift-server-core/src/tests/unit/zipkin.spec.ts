import { expect } from 'code'
import * as Lab from 'lab'

import {
  // TraceId,

} from 'zipkin'

import {
    deserializeLinkerdHeader,
    ITraceId,
    serializeLinkerdHeader,
    // randomTraceId,
    // SAMPLED,
    // SAMPLING_KNOWN,
} from '../../main/observability'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
// const before = lab.before
// const after = lab.after

describe('Zipkin', () => {
    const traceId: ITraceId = {
        traceId: '411d1802c9151ded',
        spanId: 'c3ba1a6560ca0c48',
        parentId: '2b5189ffa013ad73',
        sampled: true,
        traceIdHigh: false,
    }

    const traceId128: ITraceId = {
        traceId: '411d1802c9151ded2b5189ffa013ad73',
        spanId: 'c3ba1a6560ca0c48',
        parentId: '2b5189ffa013ad73',
        sampled: true,
        traceIdHigh: true,
    }

    const serializedTraceId: string = 'w7oaZWDKDEgrUYn/oBOtc0EdGALJFR3tAAAAAAAAAAY='

    const serializedTraceId128: string = 'w7oaZWDKDEgrUYn/oBOtc0EdGALJFR3tAAAAAAAAAAYrUYn/oBOtcw=='

    describe('deserializeLikerdHeader', () => {
        it('should correctly deserialize TraceId object with 64-bit ids', async () => {
            expect(traceId).to.equal(deserializeLinkerdHeader(serializedTraceId))
        })

        it('should correctly deserialize TraceId object with 128-bit ids', async () => {
            expect(traceId128).to.equal(deserializeLinkerdHeader(serializedTraceId128))
        })
    })

    describe('serializeLinkerdHeader', () => {
        it('should correctly serialize TraceId object with 64-bit ids', async () => {
            expect(serializeLinkerdHeader(traceId)).to.equal(serializedTraceId)
        })

        it('should correctly serialize TraceId object with 128-bit ids', async () => {
            expect(serializeLinkerdHeader(traceId128)).to.equal(serializedTraceId128)
        })
    })
})
