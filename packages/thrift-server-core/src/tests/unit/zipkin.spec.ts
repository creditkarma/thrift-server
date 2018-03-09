import { expect } from 'code'
import * as Lab from 'lab'

import { TraceId } from 'zipkin'

import {
    addL5Dheaders,
    deserializeLinkerdHeader,
    serializeLinkerdHeader,
    traceIdFromTraceId,
    traceIdValues,
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
    const traceId: TraceId = traceIdFromTraceId({
        traceId: '411d1802c9151ded',
        spanId: 'c3ba1a6560ca0c48',
        parentId: '2b5189ffa013ad73',
        sampled: true,
        traceIdHigh: false,
    })

    const traceId128: TraceId = traceIdFromTraceId({
        traceId: '411d1802c9151ded2b5189ffa013ad73',
        spanId: 'c3ba1a6560ca0c48',
        parentId: '2b5189ffa013ad73',
        sampled: true,
        traceIdHigh: true,
    })

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

    describe('addL5Dheaders', () => {
        it('should add l5d header to headers', async () => {
            const actual = addL5Dheaders({
                'x-b3-traceId': '411d1802c9151ded',
                'x-b3-spanId': 'c3ba1a6560ca0c48',
                'x-b3-parentspanid': '2b5189ffa013ad73',
                'x-b3-sampled': '1',
            })

            expect<any>(actual).to.equal({
                'x-b3-traceid': '411d1802c9151ded',
                'x-b3-spanid': 'c3ba1a6560ca0c48',
                'x-b3-parentspanid': '2b5189ffa013ad73',
                'x-b3-sampled': '1',
                'l5d-ctx-trace': 'w7oaZWDKDEgrUYn/oBOtc0EdGALJFR3tAAAAAAAAAAY=',
            })

            expect<any>(traceIdValues(deserializeLinkerdHeader(actual['l5d-ctx-trace'] as string))).to.equal({
                traceId: '411d1802c9151ded',
                spanId: 'c3ba1a6560ca0c48',
                parentId: '2b5189ffa013ad73',
                sampled: true,
                traceIdHigh: false,
            })
        })
    })
})
