import { expect } from 'code'
import * as Lab from 'lab'

import {
  ISchema,
} from '../../../main'

import {
  SchemaUtils,
} from '../../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('SchemaUtils', () => {
  describe('objectAsSimpileSchema', () => {
    it('should correctly generate a schema for an object', async () => {
      const actual: ISchema = SchemaUtils.objectAsSimpleSchema({
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
            required: true,
          },
          two: {
            type: 'number',
            required: true,
          },
          three: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                required: true,
              },
              values: {
                type: 'array',
                items: {
                  type: 'string',
                  required: true,
                },
                required: true,
              },
            },
            required: true,
          },
        },
        required: true,
      }

      expect(actual).to.equal(expected)
    })

    it('should assign empty arrays to have undefined item types', async () => {
      const actual: ISchema = SchemaUtils.objectAsSimpleSchema([])
      const expected: ISchema = {
        type: 'array',
        items: {
          type: 'undefined',
          required: false,
        },
        required: true,
      }

      expect(actual).to.equal(expected)
    })

    it('should correctly generate schema for primitive objects', async () => {
      const actual: ISchema = SchemaUtils.objectAsSimpleSchema(3)
      const expected: ISchema = {
        type: 'number',
        required: true,
      }

      expect(actual).to.equal(expected)
    })

    it('should correctly generate schema for null objects', async () => {
      const actual: ISchema = SchemaUtils.objectAsSimpleSchema(null)
      const expected: ISchema = {
        type: 'object',
        properties: {},
        required: true,
      }

      expect(actual).to.equal(expected)
    })
  })

  describe('objectMatchesSchema', () => {
    const objectSchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'string',
          required: true,
        },
        two: {
          type: 'number',
          required: true,
        },
      },
      required: true,
    }

    const strSchema: ISchema = {
      type: 'string',
    }

    const optionalSchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'string',
          required: true,
        },
        two: {
          type: 'number',
        },
      },
      required: true,
    }

    const anySchema: ISchema = {
      type: 'object',
      properties: {
        one: {
          type: 'any',
          required: true,
        },
      },
      required: true,
    }

    it('should return true if object matches given schema', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 2,
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
    })

    it('should return false if object does not match given schema', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 'two',
      })
      const expected: boolean = false

      expect(actual).to.equal(expected)
    })

    it('should return false if object includes fields not in schema', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(objectSchema, {
        one: 'one',
        two: 2,
        three: 3,
      })
      const expected: boolean = false

      expect(actual).to.equal(expected)
    })

    it('should return true if primitive matches given schema', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(strSchema, 'test')
      const expected: boolean = true

      expect(actual).to.equal(expected)
    })

    it('should return false if primitive does not match given schema', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(strSchema, 5)
      const expected: boolean = false

      expect(actual).to.equal(expected)
    })

    it('should return true if object does not include optional fields', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(optionalSchema, {
        one: 'one',
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
    })

    it('should return true with any type matching number', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(anySchema, {
        one: 5,
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
    })

    it('should return true with any type matching string', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(anySchema, {
        one: 'one',
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
    })

    it('should return true with any type matching object', async () => {
      const actual: boolean = SchemaUtils.objectMatchesSchema(anySchema, {
        one: {
          test: 'test',
        },
      })
      const expected: boolean = true

      expect(actual).to.equal(expected)
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
    const mockSchema: ISchema = SchemaUtils.objectAsSimpleSchema(mockData)

    it('should get schema for key', async () => {
      const actual = SchemaUtils.findSchemaForKey(mockSchema, 'user')
      const expected: ISchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
          location: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                required: true,
              },
              city: {
                type: 'string',
                required: true,
              },
            },
            required: true,
          },
        },
        required: true,
      }

      expect(actual.get()).to.equal(expected)
    })

    it('should get schema for nested key', async () => {
      const actual = SchemaUtils.findSchemaForKey(mockSchema, 'data.posts')
      const expected: ISchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              required: true,
            },
            date: {
              type: 'string',
              required: true,
            },
            body: {
              type: 'string',
              required: true,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                required: true,
              },
              required: true,
            },
          },
          required: true,
        },
        required: true,
      }

      expect(actual.get()).to.equal(expected)
    })
  })
})
