import { expect } from 'code'
import * as Lab from 'lab'

import {
  Utils,
} from '../../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('BasicUtils', () => {
  describe('dashToCamel', () => {
    it('should transform dashed string to camel-case', async () => {
      const base: string = 'this-is-test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
    })

    it('should return a camel-case string unaltered', async () => {
      const base: string = 'thisIsTest'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
    })

    it('should normalize case to lower and capitalize each word', async () => {
      const base: string = 'THIS-Is-Test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
    })
  })
})
