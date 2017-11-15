import { assert } from 'chai'
import * as Utils from '../../main/utils'

describe('Utils', () => {
  describe('getValueForKey', () => {
    const mockJSON = {
      one: {
        two: {
          three: false,
        },
      },
    }

    it('should return value for key at object root', () => {
      const actual: any = Utils.getValueForKey('one', mockJSON)
      const expected: any = {
        two: {
          three: false,
        },
      }

      assert.deepEqual(actual, expected)
    })

    it('should return null for a missing key', () => {
      const actual: any = Utils.getValueForKey('two', mockJSON)
      const expected: any = null

      assert.deepEqual(actual, expected)
    })

    it('should return value for a nested key', () => {
      const actual: any = Utils.getValueForKey('one.two.three', mockJSON)
      const expected: any = false

      assert.deepEqual(actual, expected)
    })
  })

  describe('dashToCamel', () => {
    it('should transform dashed string to camel-case', () => {
      const base: string = 'this-is-test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      assert.equal(actual, expected)
    })

    it('should return a camel-case string unaltered', () => {
      const base: string = 'thisIsTest'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      assert.equal(actual, expected)
    })

    it('should normalize case to lower and capitalize each word', () => {
      const base: string = 'THIS-Is-Test'
      const actual: string = Utils.dashToCamel(base)
      const expected: string = 'thisIsTest'

      assert.equal(actual, expected)
    })
  })
})
