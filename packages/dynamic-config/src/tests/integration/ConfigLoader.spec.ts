import { assert } from 'chai'
import { ConfigLoader, IConfigMap } from '../../main/'

describe('ConfigLoader', () => {
  let savedDir: string

  before((done) => {
    savedDir = process.cwd()
    process.chdir(__dirname)
    done()
  })

  describe('load', () => {
    const loader: ConfigLoader = new ConfigLoader()

    it('should load all configs in path', (done) => {
      loader.load().then((actual: Array<[string, object]>) => {
        const expected: Array<[string, object]> = [
          [ 'default', {
            project: {
              health: {
                control: '/check',
                response: 'GOOD',
              },
            },
            database: {
              username: 'root',
              password: 'root',
            },
            'hashicorp-vault': {
              apiVersion: 'v1',
              destination: 'http://localhost:8200',
              namespace: 'secret',
              tokenPath: './tmp/token',
            },
          } ],
          [ 'development', {
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
          } ],
          [ 'production', {
            project: {
              health: {
                response: 'PASS',
              },
            },
            database: {
              username: 'foo',
              password: 'bar',
            },
          } ],
          [ 'test', {
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
          } ],
        ]

        assert.deepEqual(actual, expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('loadConfigMap', () => {
    const loader: ConfigLoader = new ConfigLoader()

    it('should return configs as a map of environment -> config', (done) => {
      loader.loadConfigMap().then((actual: IConfigMap) => {
        const expected: IConfigMap = {
          default: {
            project: {
              health: {
                control: '/check',
                response: 'GOOD',
              },
            },
            database: {
              username: 'root',
              password: 'root',
            },
            'hashicorp-vault': {
              apiVersion: 'v1',
              destination: 'http://localhost:8200',
              namespace: 'secret',
              tokenPath: './tmp/token',
            },
          },
          development: {
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
          },
          test: {
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
          },
          production: {
            project: {
              health: {
                response: 'PASS',
              },
            },
            database: {
              username: 'foo',
              password: 'bar',
            },
          },
        }

        assert.deepEqual(actual, expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('resolve', () => {
    let savedEnv: string | undefined

    beforeEach(() => {
      savedEnv = process.env.NODE_ENV
    })

    afterEach(() => {
      process.env.NODE_ENV = savedEnv
    })

    it('should return the correct config map for development', (done) => {
      process.env.NODE_ENV = 'development'
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/control',
            response: 'PASS',
          },
        },
        database: {
          username: 'root',
          password: 'root',
        },
        'hashicorp-vault': {
          apiVersion: 'v1',
          destination: 'http://localhost:8200',
          namespace: 'secret',
          tokenPath: './tmp/token',
        },
      }

      loader.resolve().then((actual: any) => {
        assert.deepEqual(actual, expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should return the correct config map for production', (done) => {
      process.env.NODE_ENV = 'production'
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/check',
            response: 'PASS',
          },
        },
        database: {
          username: 'foo',
          password: 'bar',
        },
        'hashicorp-vault': {
          apiVersion: 'v1',
          destination: 'http://localhost:8200',
          namespace: 'secret',
          tokenPath: './tmp/token',
        },
      }

      loader.resolve().then((actual: any) => {
        assert.deepEqual(actual, expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should default to loading development config', (done) => {
      process.env.NODE_ENV = ''
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/control',
            response: 'PASS',
          },
        },
        database: {
          username: 'root',
          password: 'root',
        },
        'hashicorp-vault': {
          apiVersion: 'v1',
          destination: 'http://localhost:8200',
          namespace: 'secret',
          tokenPath: './tmp/token',
        },
      }

      loader.resolve().then((actual: any) => {
        assert.deepEqual(actual, expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  after((done) => {
    process.chdir(savedDir)
    done()
  })
})
