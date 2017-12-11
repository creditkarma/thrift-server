import { expect } from 'code'
import * as Lab from 'lab'
import { ISchema } from '../../main/types'
import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
  // describe('overlay', () => {

  // })

  describe('objectAsSimpileSchema', () => {
    it('should correctly generate a schema for an object', (done) => {
      const actual: ISchema = Utils.objectAsSimpleSchema({
        one: 'one',
        two: 56,
        three: {
          type: 'word',
          values: [ 'one' ],
        },
      })
      const expected: ISchema = {
        type: 'object',
        properties: {
          one: {
            type: 'string',
          },
          two: {
            type: 'number',
          },
          three: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
              },
              values: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should assign empty arrays to have undefined item types', (done) => {
      const actual: ISchema = Utils.objectAsSimpleSchema([])
      const expected: ISchema = {
        type: 'array',
        items: {
          type: 'undefined',
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should correctly generate schema for primitive objects', (done) => {
      const actual: ISchema = Utils.objectAsSimpleSchema(3)
      const expected: ISchema = {
        type: 'number',
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should correctly generate schema for null objects', (done) => {
      const actual: ISchema = Utils.objectAsSimpleSchema(null)
      const expected: ISchema = {
        type: 'object',
        properties: {},
      }

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('findSchemaForKey', () => {
    const mockData = {
      user: {
        name: 'Bob Smith',
        age: 32,
        location: {
          state: 'CA',
          city: 'Barstow',
        },
      },
      data: {
        favorites: [ 'video games', 'sports' ],
        posts: [
          {
            title: 'My Stupid Post',
            date: 'May 23, 1998',
            body: 'I like this internet thing',
            tags: [ 'dumb', 'stuff' ],
          },
        ],
      },
    }
    const mockSchema = Utils.objectAsSimpleSchema(mockData)

    it('should get schema for key', (done) => {
      const actual = Utils.findSchemaForKey(mockSchema, 'user')
      const expected: ISchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'number',
          },
          location: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
            },
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should get schema for nested key', (done) => {
      const actual = Utils.findSchemaForKey(mockSchema, 'data.posts')
      const expected: ISchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
            },
            date: {
              type: 'string',
            },
            body: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })
  })

  describe('objectHasShape', () => {
    const tester = Utils.objectHasShape({
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

  describe('resolveObjects', () => {
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

      const actual = Utils.resolveObjects(baseConfig, updateConfig)

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

      const actual = Utils.resolveObjects(baseConfig, updateConfig)

      expect(actual).to.equal(expected)
      done()
    })
  })
})