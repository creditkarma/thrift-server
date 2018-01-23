import { expect } from 'code'
import * as Lab from 'lab'
import {
  ConfigLoader,
  IRootConfigValue,
  jsLoader,
  jsonLoader,
  tsLoader,
} from '../../main/'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach

describe('ConfigLoader', () => {

  before(async () => {
    process.chdir(__dirname)
  })

  describe('resolve', () => {
    let savedEnv: string | undefined

    beforeEach(async () => {
      savedEnv = process.env.NODE_ENV
    })

    afterEach(async () => {
      process.env.NODE_ENV = savedEnv
    })

    it('should return the correct config for development', async () => {
      process.env.NODE_ENV = 'development'
      const loader: ConfigLoader = new ConfigLoader({
        loaders: [
          jsonLoader,
          jsLoader,
          tsLoader,
        ],
      })
      const expected: IRootConfigValue = {
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
                    resolved: false,
                    type: 'promise',
                    value: Promise.resolve('DELAYED'),
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

      return loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
      })
    })

    it('should return the correct config for production', async () => {
      process.env.NODE_ENV = 'production'
      const loader: ConfigLoader = new ConfigLoader({
        loaders: [
          jsonLoader,
          jsLoader,
          tsLoader,
        ],
      })
      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          project: {
            source: {
              type: 'local',
              name: 'production',
            },
            resolved: true,
            type: 'object',
            properties: {
              health: {
                source: {
                  type: 'local',
                  name: 'production',
                },
                resolved: true,
                type: 'object',
                properties: {
                  control: {
                    source: {
                      type: 'local',
                      name: 'production',
                    },
                    resolved: true,
                    type: 'string',
                    value: '/typescript',
                    watchers: [],
                  },
                  response: {
                    source: {
                      type: 'local',
                      name: 'production',
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
              name: 'production',
            },
            resolved: true,
            type: 'object',
            properties: {
              username: {
                source: {
                  type: 'local',
                  name: 'production',
                },
                resolved: false,
                type: 'placeholder',
                value: {
                  _source: 'env',
                  _key: 'TEST_USERNAME',
                  _default: 'default-user',
                },
                watchers: [],
              },
              password: {
                source: {
                  type: 'local',
                  name: 'production',
                },
                resolved: false,
                type: 'placeholder',
                value: {
                  _source: 'env',
                  _key: 'TEST_PASSWORD',
                  _default: 'monkey',
                },
                watchers: [],
              },
            },
            watchers: [],
          },
        },
      }

      return loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
      })
    })

    it('should return the correct config for test', async () => {
      process.env.NODE_ENV = 'test'
      const loader: ConfigLoader = new ConfigLoader({
        loaders: [
          jsonLoader,
          jsLoader,
          tsLoader,
        ],
      })
      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          project: {
            source: {
              type: 'local',
              name: 'test',
            },
            resolved: true,
            type: 'object',
            properties: {
              health: {
                source: {
                  type: 'local',
                  name: 'test',
                },
                resolved: true,
                type: 'object',
                properties: {
                  control: {
                    source: {
                      type: 'local',
                      name: 'test',
                    },
                    resolved: true,
                    type: 'string',
                    value: '/test',
                    watchers: [],
                  },
                  response: {
                    source: {
                      type: 'local',
                      name: 'test',
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

      return loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
      })
    })

    it('should only load default config if file for NODE_ENV does not exist', async () => {
      process.env.NODE_ENV = 'integration'
      const loader: ConfigLoader = new ConfigLoader({
        loaders: [
          jsonLoader,
          jsLoader,
          tsLoader,
        ],
      })
      const expected: IRootConfigValue = {
        type: 'root',
        properties: {
          project: {
            source: {
              type: 'local',
              name: 'default',
            },
            resolved: true,
            type: 'object',
            properties: {
              health: {
                source: {
                  type: 'local',
                  name: 'default',
                },
                resolved: true,
                type: 'object',
                properties: {
                  control: {
                    source: {
                      type: 'local',
                      name: 'default',
                    },
                    resolved: true,
                    type: 'string',
                    value: '/check',
                    watchers: [],
                  },
                  response: {
                    source: {
                      type: 'local',
                      name: 'default',
                    },
                    resolved: true,
                    type: 'string',
                    value: 'GOOD',
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

      return loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
      })
    })

    it('should default to loading development config', async () => {
      process.env.NODE_ENV = ''
      const loader: ConfigLoader = new ConfigLoader({
        loaders: [
          jsonLoader,
          jsLoader,
          tsLoader,
        ],
      })
      const expected: IRootConfigValue = {
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
                    resolved: false,
                    type: 'promise',
                    value: Promise.resolve('DELAYED'),
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

      return loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
      })
    })
  })
})
