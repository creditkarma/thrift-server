import { assert } from 'chai'
import { IQueryMap } from '../../main/types'
import * as Utils from '../../main/utils'

describe('Utils', () => {
  describe('deepMerge', () => {
    it('should merge two objects', () => {
      const obj1 = { foo: 'bar' }
      const obj2 = { one: 'two' }
      const expected = { foo: 'bar', one: 'two' }
      const actual = Utils.deepMerge(obj1, obj2)

      assert.deepEqual(actual, expected)
    })

    it('should perform a deep merge on two objects', () => {
      const obj1 = {
        foo: 'bar',
        obj: {
          one: 'one',
          three: 'three',
        },
      }
      const obj2 = {
        obj: {
          one: 'two',
          four: 'four',
        },
      }
      const expected = {
        foo: 'bar',
        obj: {
          one: 'two',
          three: 'three',
          four: 'four',
        },
      }
      const actual = Utils.deepMerge(obj1, obj2)

      assert.deepEqual(actual, expected)
    })
  })

  describe('removeLeadingTrailingSlash', () => {
    it('should remove both leading and trailing slash from string', () => {
      const testStr: string = '/what am i doing here?/'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      assert.equal(actual, expected)
    })

    it('should remove trailing slash from string', () => {
      const testStr: string = 'what am i doing here?/'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      assert.equal(actual, expected)
    })

    it('should remove leading slash from string', () => {
      const testStr: string = '/what am i doing here?'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      assert.equal(actual, expected)
    })

    it('should leave other strings unaltered', () => {
      const testStr: string = 'what am i doing here?'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      assert.equal(actual, expected)
    })
  })

  describe('cleanQueryParams', () => {
    it('should remove false values from a key/value map', () => {
      const testObj: IQueryMap = { key1: false, key2: true }
      const actual: IQueryMap = Utils.cleanQueryParams(testObj)
      const expected: IQueryMap = { key2: true }

      assert.deepEqual(actual, expected)
    })

    it('should remove undefined values from a key/value map', () => {
      const testObj: IQueryMap = { key1: 'one', key2: undefined, key3: 'test' }
      const actual: IQueryMap = Utils.cleanQueryParams(testObj)
      const expected: IQueryMap = { key1: 'one', key3: 'test' }

      assert.deepEqual(actual, expected)
    })
  })
})
