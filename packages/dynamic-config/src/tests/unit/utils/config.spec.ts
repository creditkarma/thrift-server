import { expect } from 'code'
import * as Lab from 'lab'

import {
  ConfigUtils,
} from '../../../main/utils'

import {
  ConfigValue,
  IRootConfigValue,
} from '../../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('ConfigUtils', () => {
  describe('getConfigForKey', () => {
    it('should get specified value from root config', async () => {
      const mockConfig: IRootConfigValue = {
        type: 'root',
        properties: {
          project: {
            source: {
              type: 'local',
              name: 'development',
            },
            resolved: true,
            type: 'object',
            properties: {
              health: {
                source: {
                  type: 'local',
                  name: 'development',
                },
                resolved: true,
                type: 'object',
                properties: {
                  control: {
                    source: {
                      type: 'local',
                      name: 'development',
                    },
                    resolved: true,
                    type: 'string',
                    value: '/javascript',
                    watchers: [],
                  },
                  response: {
                    source: {
                      type: 'local',
                      name: 'development',
                    },
                    resolved: true,
                    type: 'string',
                    value: 'PASS',
                    watchers: [],
                  },
                },
                watchers: [],
              },
            },
            watchers: [],
          },
          database: {
            source: {
              type: 'local',
              name: 'default',
            },
            resolved: true,
            type: 'object',
            properties: {
              username: {
                source: {
                  type: 'local',
                  name: 'default',
                },
                resolved: true,
                type: 'string',
                value: 'root',
                watchers: [],
              },
              password: {
                source: {
                  type: 'local',
                  name: 'default',
                },
                resolved: true,
                type: 'string',
                value: 'root',
                watchers: [],
              },
            },
            watchers: [],
          },
        },
      }

      const actual: ConfigValue | null = ConfigUtils.getConfigForKey('project.health', mockConfig)
      const expected: any = {
        source: {
          type: 'local',
          name: 'development',
        },
        resolved: true,
        type: 'object',
        properties: {
          control: {
            source: {
              type: 'local',
              name: 'development',
            },
            resolved: true,
            type: 'string',
            value: '/javascript',
            watchers: [],
          },
          response: {
            source: {
              type: 'local',
              name: 'development',
            },
            resolved: true,
            type: 'string',
            value: 'PASS',
            watchers: [],
          },
        },
        watchers: [],
      }

      expect(actual).to.equal(expected)
    })
  })
})
