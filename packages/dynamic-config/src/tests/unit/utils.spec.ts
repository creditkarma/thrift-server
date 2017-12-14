import { expect } from 'code'
import * as Lab from 'lab'
import { ISchema } from '../../main/types'
import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
  describe('objectMatchesSchema', () => {
    const objectSchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'string',
        },
        two: {
          type: 'number',
        },
      },
    }

    const strSchema: ISchema = {
      type: 'string',
    }

    const optionalSchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'string',
        },
        two: {
          type: 'number',
          required: false,
        },
      },
    }

    const anySchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'any',
        },
      },
    }

    it('should return true if object matches given schema', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 2,
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })

    it('should return false if object does not match given schema', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 'two',
      })
      const expected: boolean = false

      expect(actual).to.equal(expected)
      done()
    })

    it('should return false if object includes fields not in schema', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 2,
        three: 3,
      })
      const expected: boolean = false

      expect(actual).to.equal(expected)
      done()
    })

    it('should return true if primitive matches given schema', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(strSchema, 'test')
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })

    it('should return false if primitive does not match given schema', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(strSchema, 5)
      const expected: boolean = false

      expect(actual).to.equal(expected)
      done()
    })

    it('should return true object does not include optional fields', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(optionalSchema, {
        one: 'one',
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })

    it('should return true with any type matching number', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(anySchema, {
        one: 5,
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })

    it('should return true with any type matching string', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(anySchema, {
        one: 'one',
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })

    it('should return true with any type matching object', (done) => {
      const actual: boolean = Utils.objectMatchesSchema(anySchema, {
        one: {
          test: 'test',
        },
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
      done()
    })
  })

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

  describe('setValueForKey', () => {
    const mockJSON = {
      one: {
        two: {
          three: false,
        },
      },
    }

    it('should set the value of given key', (done) => {
      const actual: any = Utils.setValueForKey('one', 'one', mockJSON)
      const expected: any = {
        one: 'one',
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should set the value of given nested key', (done) => {
      const actual: any = Utils.setValueForKey('one.two.three', true, mockJSON)
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

    it('should ignore setting non-existent props', (done) => {
      const actual: any = Utils.setValueForKey('one.two.four', true, mockJSON)
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

      const actual = Utils.overlayObjects(baseConfig, updateConfig)

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

      const actual = Utils.overlayObjects(baseConfig, updateConfig)

      expect(actual).to.equal(expected)
      done()
    })
  })
})
