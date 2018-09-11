import { expect } from 'code'
import * as Lab from 'lab'

import { Int64 } from '../../main/Int64'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Int64', () => {
    const TEST_STRING: string = '9837756439'
    const TOO_LARGE: string = '999999999999999999999999999999'

    describe('fromDecimalString', () => {
        it('should correctly create Int64 from string', async () => {
            const i64 = Int64.fromDecimalString(TEST_STRING)
            expect(i64.toDecimalString()).to.equal(TEST_STRING)
        })

        it('should throw if the decimal string is too large for Int64', async () => {
            expect(() => Int64.fromDecimalString(TOO_LARGE)).to.throw()
        })
    })

    describe('toDecimalString', () => {
        it('should correctly create a string representation of number', async () => {
            const i64 = new Int64(54)
            expect(i64.toDecimalString()).to.equal('54')
        })

        it('should correctly create a string representation of a hex number', async () => {
            const i64 = new Int64('0xffff')
            expect(i64.toDecimalString()).to.equal('65535')
        })
    })
})
