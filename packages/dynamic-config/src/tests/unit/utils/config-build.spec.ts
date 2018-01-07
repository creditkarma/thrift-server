import { expect } from 'code'
import * as Lab from 'lab'

import {
  IRootConfigValue,
} from '../../../main'

import {
  ConfigBuilder,
} from '../../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('ConfigBuilder', () => {
  describe('createConfigObject', () => {
    it('should build config for object', (done) => {
      const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
        'test',
        'local',
        {
          protocol: 'https',
          destination: '127.0.0.1:9000',
          hostHeader: 'hvault.com',
          sslValidation: false,
          namespace: '/your-group/your-service',
          tokenPath: '/tmp/test-token',
        },
      )

      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          protocol: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'string',
            value: 'https',
            watchers: [],
          },
          destination: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'string',
            value: '127.0.0.1:9000',
            watchers: [],
          },
          hostHeader: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'string',
            value: 'hvault.com',
            watchers: [],
          },
          sslValidation: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'boolean',
            value: false,
            watchers: [],
          },
          namespace: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'string',
            value: '/your-group/your-service',
            watchers: [],
          },
          tokenPath: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'string',
            value: '/tmp/test-token',
            watchers: [],
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should build config with nested keys', (done) => {
      const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
        'test',
        'local',
        {
          server: {
            host: 'localhost',
            port: 8080,
          },
        },
      )

      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          server: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'object',
            properties: {
              host: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: true,
                type: 'string',
                value: 'localhost',
                watchers: [],
              },
              port: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: true,
                type: 'number',
                value: 8080,
                watchers: [],
              },
            },
            watchers: [],
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should build config with promised values', (done) => {
      const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
        'test',
        'local',
        {
          server: {
            host: Promise.resolve('localhost'),
            port: Promise.resolve(8080),
          },
        },
      )

      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          server: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'object',
            properties: {
              host: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: false,
                type: 'promise',
                value: Promise.resolve('localhost'),
                watchers: [],
              },
              port: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: false,
                type: 'promise',
                value: Promise.resolve(8080),
                watchers: [],
              },
            },
            watchers: [],
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should build config with placeholder values', (done) => {
      const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
        'test',
        'local',
        {
          server: {
            host: 'consul!/host-name',
            port: {
              key: 'consul!/port-number',
              default: 8080,
            },
          },
        },
      )

      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          server: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'object',
            properties: {
              host: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: false,
                type: 'placeholder',
                value: {
                  key: 'consul!/host-name',
                },
                watchers: [],
              },
              port: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: false,
                type: 'placeholder',
                value: {
                  key: 'consul!/port-number',
                  default: 8080,
                },
                watchers: [],
              },
            },
            watchers: [],
          },
        },
      }

      expect(actual).to.equal(expected)
      done()
    })

    it('should throw if config value is not an object', (done) => {
      expect(() => {
        ConfigBuilder.createConfigObject('test', 'local', 5)
      }).to.throw()
      done()
    })
  })
})
