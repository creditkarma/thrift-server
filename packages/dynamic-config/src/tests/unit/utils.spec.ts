import { expect } from 'code'
import * as Lab from 'lab'

import {
  ObjectUtils,
  Utils,
} from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
  describe('BasicUtils', () => {
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

  // describe('ConfigUtils', () => {

  // })

  describe('ObjectUtils', () => {
    describe('getValueForKey', () => {
      const mockJSON = {
        one: {
          two: {
            three: false,
          },
        },
      }

      it('should return value for key at object root', (done) => {
        const actual: any = ObjectUtils.getValueForKey('one', mockJSON)
        const expected: any = {
          two: {
            three: false,
          },
        }

        expect(actual).to.equal(expected)
        done()
      })

      it('should return null for a missing key', (done) => {
        const actual: any = ObjectUtils.getValueForKey('two', mockJSON)
        const expected: any = null

        expect(actual).to.equal(expected)
        done()
      })

      it('should return value for a nested key', (done) => {
        const actual: any = ObjectUtils.getValueForKey('one.two.three', mockJSON)
        const expected: any = false

        expect(actual).to.equal(expected)
        done()
      })
    })

    describe('setValueForKey', () => {
      const mockJSON = {
        one: {
          two: {
            three: false,
          },
        },
      }

      it('should set the value of given key', (done) => {
        const actual: any = ObjectUtils.setValueForKey('one', 'one', mockJSON)
        const expected: any = {
          one: 'one',
        }

        expect(actual).to.equal(expected)
        done()
      })

      it('should set the value of given nested key', (done) => {
        const actual: any = ObjectUtils.setValueForKey('one.two.three', true, mockJSON)
        const expected: any = {
          one: {
            two: {
              three: true,
            },
          },
        }

        expect(actual).to.equal(expected)
        done()
      })

      it('should set the value of an array at given index', (done) => {
        const mockWithArray = {
          one: {
            two: [
              { three: true },
              { three: true },
              { three: true },
              { three: true },
            ],
          },
        }
        const actual: any = ObjectUtils.setValueForKey('one.two.2.three', false, mockWithArray)
        const expected: any = {
          one: {
            two: [
              { three: true },
              { three: true },
              { three: false },
              { three: true },
            ],
          },
        }

        expect(actual).to.equal(expected)
        done()
      })

      it('should ignore setting non-existent props', (done) => {
        const actual: any = ObjectUtils.setValueForKey('one.two.four', true, mockJSON)
        const expected: any = {
          one: {
            two: {
              three: false,
            },
          },
        }

        expect(actual).to.equal(expected)
        done()
      })
    })

    describe('objectHasShape', () => {
      const tester = ObjectUtils.objectHasShape({
        default: 'default',
        key: 'key',
      })

      it('shoult return true if object matches given shape', (done) => {
        const actual: boolean = tester({
          default: 'foo',
          key: 'bar',
        })

        expect(actual).to.equal(true)
        done()
      })

      it('shoult return false if object does not match given shape', (done) => {
        const actual: boolean = tester({
          foo: 'foo',
          key: 'bar',
        })

        expect(actual).to.equal(false)
        done()
      })
    })

    describe('overlayObjects', () => {
      it('should override base values with update values', (done) => {
        const baseConfig = {
          protocol: 'https',
          destination: '127.0.0.1:9000',
          hostHeader: 'hvault.com',
          sslValidation: false,
          namespace: '/your-group/your-service',
          tokenPath: '/tmp/test-token',
        }

        const updateConfig = {
          protocol: 'http',
          destination: '127.0.0.1:8200',
          hostHeader: 'hvault.com',
          sslValidation: true,
        }

        const expected = {
          protocol: 'http',
          destination: '127.0.0.1:8200',
          hostHeader: 'hvault.com',
          sslValidation: true,
          namespace: '/your-group/your-service',
          tokenPath: '/tmp/test-token',
        }

        const actual = ObjectUtils.overlayObjects(baseConfig, updateConfig)

        expect(actual).to.equal(expected)
        done()
      })

      it('should correctly handle nested objects', (done) => {
        const baseConfig = {
          serviceName: 'test',
          lru: {
            max: 500,
            maxAge: 3600000,
          },
        }

        const updateConfig = {
          serviceName: 'test-development',
          lru: {
            maxAge: 480000,
          },
        }

        const expected = {
          serviceName: 'test-development',
          lru: {
            max: 500,
            maxAge: 480000,
          },
        }

        const actual = ObjectUtils.overlayObjects(baseConfig, updateConfig)

        expect(actual).to.equal(expected)
        done()
      })
    })
  })
})
