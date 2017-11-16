import { assert } from 'chai'
import * as TokenDiscovery from '../../main/discovery'

describe('TokenDiscovery', () => {
  describe('cleanLastChar', () => {
    it('should remove trailing \\n character from string', () => {
      const test: string = 'This is a test\n'
      const actual: string = TokenDiscovery.cleanLastChar(test)
      const expected: string = 'This is a test'
      assert.equal(actual, expected)
    })

    it('should remove trailing \\r character from string', () => {
      const test: string = 'This is a test\r'
      const actual: string = TokenDiscovery.cleanLastChar(test)
      const expected: string = 'This is a test'
      assert.equal(actual, expected)
    })

    it('should return a string without trailing newline unaltered', () => {
      const test: string = 'This is a test'
      const actual: string = TokenDiscovery.cleanLastChar(test)
      const expected: string = 'This is a test'
      assert.equal(actual, expected)
    })
  })
})
