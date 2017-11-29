import { expect } from 'code'
import * as Lab from 'lab'
import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
  describe('getValueForKey', () => {
    const mockJSON = {
      one: {
        two: {
          three: false,
        },
      },
    }

    it('should return value for key at object root', (done) => {
      const actual: any = Utils.getValueForKey('one', mockJSON)
      const expected: any = {
        two: {
          three: false,
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should return null for a missing key', (done) => {
      const actual: any = Utils.getValueForKey('two', mockJSON)
      const expected: any = null

      expect(actual).to.equal(expected)
      done()
    })

    it('should return value for a nested key', (done) => {
      const actual: any = Utils.getValueForKey('one.two.three', mockJSON)
      const expected: any = false

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('dashToCamel', () => {
    it('should transform dashed string to camel-case', (done) => {
      const base: string = 'this-is-test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
      done()
    })

    it('should return a camel-case string unaltered', (done) => {
      const base: string = 'thisIsTest'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
      done()
    })

    it('should normalize case to lower and capitalize each word', (done) => {
      const base: string = 'THIS-Is-Test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      expect(actual).to.equal(expected)
      done()
    })
  })
})
