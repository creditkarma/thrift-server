import { expect } from 'code'
import * as Lab from 'lab'
import { IQueryMap } from '../../main/types'
import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
  describe('deepMerge', () => {
    it('should merge two objects', (done) => {
      const obj1 = { foo: 'bar' }
      const obj2 = { one: 'two' }
      const expected = { foo: 'bar', one: 'two' }
      const actual = Utils.deepMerge(obj1, obj2)

      expect(actual).to.equal(expected)
      done()
    })

    it('should perform a deep merge on two objects', (done) => {
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

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('removeLeadingTrailingSlash', () => {
    it('should remove both leading and trailing slash from string', (done) => {
      const testStr: string = '/what am i doing here?/'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      expect(actual).to.equal(expected)
      done()
    })

    it('should remove trailing slash from string', (done) => {
      const testStr: string = 'what am i doing here?/'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      expect(actual).to.equal(expected)
      done()
    })

    it('should remove leading slash from string', (done) => {
      const testStr: string = '/what am i doing here?'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      expect(actual).to.equal(expected)
      done()
    })

    it('should leave other strings unaltered', (done) => {
      const testStr: string = 'what am i doing here?'
      const actual: string = Utils.removeLeadingTrailingSlash(testStr)
      const expected: string = 'what am i doing here?'

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('cleanQueryParams', () => {
    it('should remove false values from a key/value map', (done) => {
      const testObj: IQueryMap = { key1: false, key2: true }
      const actual: IQueryMap = Utils.cleanQueryParams(testObj)
      const expected: IQueryMap = { key2: true }

      expect<IQueryMap>(actual).to.equal(expected)
      done()
    })

    it('should remove undefined values from a key/value map', (done) => {
      const testObj: IQueryMap = { key1: 'one', key2: undefined, key3: 'test' }
      const actual: IQueryMap = Utils.cleanQueryParams(testObj)
      const expected: IQueryMap = { key1: 'one', key3: 'test' }

      expect<IQueryMap>(actual).to.equal(expected)
      done()
    })
  })
})
