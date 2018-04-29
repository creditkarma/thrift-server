import { expect } from 'code'
import * as Lab from 'lab'

import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
// const before = lab.before
// const after = lab.after

describe('Utils', () => {
    describe('deepMerge', () => {
        it('should merge two objects into new object', async () => {
            const obj1: any = {
                name: {
                    first: 'Bob',
                    last: 'Smith',
                },
            }
            const obj2: any = {
                name: {
                    last: 'Murphy',
                },
                email: 'bob@fake.com',
            }
            const actual = Utils.deepMerge(obj1, obj2)
            const expected: any = {
                name: {
                    first: 'Bob',
                    last: 'Murphy',
                },
                email: 'bob@fake.com',
            }

            expect(actual).to.equal(expected)
            expect(obj1).to.equal({
                name: {
                    first: 'Bob',
                    last: 'Smith',
                },
            })
        })
    })
})
