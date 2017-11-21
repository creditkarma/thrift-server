import { assert } from 'chai'
import * as Utils from '../../main/utils'
import { IHVConfig } from '../../main/types'

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
          three: 'three'
        }
      }
      const obj2 = {
        obj: {
          one: 'two',
          four: 'four'
        }
      }
      const expected = {
        foo: 'bar',
        obj: {
          one: 'two',
          three: 'three',
          four: 'four'
        }
      }
      const actual = Utils.deepMerge(obj1, obj2)

      assert.deepEqual(actual, expected)
    })
  })

  describe('resolveConfig', () => {
    it('should apply options to default config', () => {
      const options: IHVConfig = {
        protocol: 'https',
        destination: 'localhost:8000',
        hostHeader: 'host',
        namespace: 'path',
        tokenPath: '/tmp/token',
      }
      const expected: IHVConfig = {
        protocol: 'https',
        apiVersion: 'v1',
        destination: 'localhost:8000',
        hostHeader: 'host',
        namespace: 'path',
        tokenPath: '/tmp/token',
      }
      const actual = Utils.resolveConfig(options)

      assert.deepEqual(actual, expected)
    })
  })
})
