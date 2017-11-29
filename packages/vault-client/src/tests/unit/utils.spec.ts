import { expect } from 'code'
import * as Lab from 'lab'
import * as Utils from '../../main/utils'
import { IHVConfig } from '../../main/types'

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

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('resolveConfig', () => {
    it('should apply options to default config', (done) => {
      const options: Partial<IHVConfig> = {
        destination: 'localhost:8000',
        namespace: 'path',
        requestOptions: {
          headers: {
            host: 'localhost'
          }
        }
      }
      const expected: IHVConfig = {
        apiVersion: 'v1',
        destination: 'localhost:8000',
        namespace: 'path',
        tokenPath: '/tmp/token',
        requestOptions: {
          headers: {
            host: 'localhost'
          }
        }
      }
      const actual = Utils.resolveConfig(options)

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('cleanSecret', () => {
    it('should correctly join a secret path', (done) => {
      const namespace: string = 'what'
      const secret: string = '/secret/key'
      const actual: string = Utils.cleanSecret(namespace, secret)
      const expected: string = 'what/secret/key'

      expect(actual).to.equal(expected)
      done()
    })

    it('should correctly handle extra slashes', (done) => {
      const namespace: string = 'what/'
      const secret: string = '/secret/key'
      const actual: string = Utils.cleanSecret(namespace, secret)
      const expected: string = 'what/secret/key'

      expect(actual).to.equal(expected)
      done()
    })

    it('should remove leading slash', (done) => {
      const namespace: string = '/what/'
      const secret: string = '/secret/key'
      const actual: string = Utils.cleanSecret(namespace, secret)
      const expected: string = 'what/secret/key'

      expect(actual).to.equal(expected)
      done()
    })

    it('should remove trailing slash', (done) => {
      const namespace: string = '/what/'
      const secret: string = '/secret/key/'
      const actual: string = Utils.cleanSecret(namespace, secret)
      const expected: string = 'what/secret/key'

      expect(actual).to.equal(expected)
      done()
    })
  })
})
