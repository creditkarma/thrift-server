import { expect } from 'code'
import * as Lab from 'lab'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Thrift Server Core', () => {

    it('should true equal true', (done: any) => {
        expect(true).to.equal(true)
        done()
    })
})
