import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import {
  consulResolver,
  DynamicConfig,
  environmentResolver,
  jsLoader,
  jsonLoader,
  tsLoader,
  vaultResolver,
} from '../../main/'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before

describe('DynamicConfig', () => {

  before(async () => {
    process.chdir(__dirname)
  })

  describe('Configured with Vault and Consul', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      remoteOptions: {
        consul: {
          consulAddress: 'http://localhost:8510',
          consulKeys: 'test-config-one,with-vault',
          consulKvDc: 'dc1',
        },
      },
      resolvers: [
        consulResolver(),
        vaultResolver(),
      ],
      loaders: [
        jsonLoader,
        jsLoader,
        tsLoader,
      ],
    })

    describe('get', () => {
      it('should return full config when making empty call to get', async () => {
        return dynamicConfig.get().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'K1ndaS3cr3t',
            },
            project: {
              health: {
                control: '/javascript',
                response: 'DELAYED',
              },
            },
            'hashicorp-vault': {
              apiVersion: 'v1',
              destination: 'http://localhost:8210',
              mount: 'secret',
              tokenPath: './tmp/token',
            },
          })
        })
      })

      it('should return the value from Consul if available', async () => {
        return dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('testUser')
        })
      })

      it('should fetch value from Vault when value is Vault placeholder', async () => {
        return dynamicConfig.get<string>('database.password').then((actual: string) => {
          expect(actual).to.equal('K1ndaS3cr3t')
        })
      })

      it('should fallback to returning from local config', async () => {
        return dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
            control: '/javascript',
            response: 'DELAYED',
          })
        })
      })

      it('should reject for a missing key', async () => {
        return dynamicConfig.get<object>('fake.path').then((actual: object) => {
          throw new Error('Should reject for missing key')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[fake.path]')
        })
      })
    })

    describe('getAll', () => {
      it('should resolve with all requested config values', async () => {
        return dynamicConfig.getAll('database.username', 'database.password').then((actual: any) => {
          expect(actual).to.equal([ 'testUser', 'K1ndaS3cr3t' ])
        })
      })

      it('should reject if one of the values is missing', async () => {
        return dynamicConfig.getAll('database.username', 'database.fake').then((val: any) => {
          throw new Error('Promise should reject')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[database.fake]')
        })
      })
    })

    describe('getWithDefault', () => {
      it('should resolve with with value if found', async () => {
        return dynamicConfig.getWithDefault('database.username', 'defaultUser').then((actual: any) => {
          expect(actual).to.equal('testUser')
        })
      })

      it('should resolve with with default if value not found', async () => {
        return dynamicConfig.getWithDefault('database.fake', 'defaultResponse').then((actual: any) => {
          expect(actual).to.equal('defaultResponse')
        })
      })
    })

    describe('getSecretValue', () => {
      it('should get secret value from Vault', async () => {
        return dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          expect(actual).to.equal('this is a secret')
        })
      })

      it('should reject for a missing secret', async () => {
        return dynamicConfig.getSecretValue<string>('missing-secret').then((actual: string) => {
          throw new Error('Should reject for missing secret')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[missing-secret]')
        })
      })
    })
  })

  describe('Configured with Consul', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      remoteOptions: {
        consul: {
          consulAddress: 'http://localhost:8510',
          consulKeys: 'test-config-one',
          consulKvDc: 'dc1',
        },
      },
      resolvers: [
        consulResolver(),
        vaultResolver(),
      ],
      loaders: [
        jsonLoader,
        jsLoader,
        tsLoader,
      ],
    })

    describe('get', () => {
      it('should return full config when making empty call to get', async () => {
        return dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'Sup3rS3cr3t',
            },
            project: {
              health: {
                control: '/javascript',
                response: 'DELAYED',
              },
            },
          })
        })
      })

      it('should return the value from Consul if available', async () => {
        return dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('testUser')
        })
      })

      it('should fetch value from Consul when value is Consul placeholder', async () => {
        return dynamicConfig.get<string>('database.password').then((actual: string) => {
          expect(actual).to.equal('Sup3rS3cr3t')
        })
      })

      it('should mutate config after getting new data from Consul', async () => {
        return dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'Sup3rS3cr3t',
            },
            project: {
              health: {
                control: '/javascript',
                response: 'DELAYED',
              },
            },
          })
        })
      })

      it('should fallback to returning from local config', async () => {
        return dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
            control: '/javascript',
            response: 'DELAYED',
          })
        })
      })

      it('should reject for a missing key', async () => {
        return dynamicConfig.get<object>('fake.path').then((actual: object) => {
          throw new Error('Should reject for missing key')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[fake.path]')
        })
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', async () => {
        return dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          throw new Error('Should reject when Vault not configured')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[test-secret]')
        })
      })
    })
  })

  describe('Configured with Overlayed Consul Configs', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      remoteOptions: {
        consul: {
          consulAddress: 'http://localhost:8510',
          consulKeys: 'test-config-one,test-config-two',
          consulKvDc: 'dc1',
        },
      },
      resolvers: [
        consulResolver(),
        vaultResolver(),
      ],
      loaders: [
        jsonLoader,
        jsLoader,
        tsLoader,
      ],
    })

    describe('get', () => {
      it('should return full config when making empty call to get', async () => {
        return dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'fakeUser',
              password: 'NotSoSecret',
            },
            project: {
              health: {
                control: '/javascript',
                response: 'DELAYED',
              },
            },
          })
        })
      })

      it('should return default value if unable to get from Consul', async () => {
        return dynamicConfig.get<string>('database.password').then((actual: any) => {
          expect(actual).to.equal('NotSoSecret')
        })
      })
    })
  })

  describe('Without Consul or Vault Configured', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      loaders: [
        jsonLoader,
        jsLoader,
        tsLoader,
      ],
    })

    describe('get', () => {
      it('should return the value from local config', async () => {
        return dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('root')
        })
      })

      it('should fallback to returning from local config', async () => {
        return dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
            control: '/javascript',
            response: 'DELAYED',
          })
        })
      })

      it('should reject for a missing key', async () => {
        return dynamicConfig.get<object>('fake.path').then((actual: object) => {
          throw new Error('Should reject for missing key')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[fake.path]')
        })
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', async () => {
        return dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          throw new Error(`Unable to retrieve key[test-secret]. Should reject when Vault not configured`)
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve key[test-secret]. No resolver found.')
        })
      })
    })
  })

  describe('When Using Environment Variables', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'production',
      configPath: path.resolve(__dirname, './config'),
      resolvers: [ environmentResolver() ],
      loaders: [
        jsonLoader,
        jsLoader,
        tsLoader,
      ],
    })

    process.env.TEST_USERNAME = 'foobarwilly'

    describe('get', () => {
      it('should return value stored in environment variable', async () => {
        return dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('foobarwilly')
        })
      })

      it('should return the default for value missing in environment', async () => {
        return dynamicConfig.get<string>('database.password').then((actual: string) => {
          expect(actual).to.equal('monkey')
        })
      })

      it('should fallback to returning from local config', async () => {
        return dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
            control: '/typescript',
            response: 'PASS',
          })
        })
      })

      it('should reject for a missing key', async () => {
        return dynamicConfig.get<object>('fake.path').then((actual: object) => {
          throw new Error('Should reject for missing key')
        }, (err: any) => {
          expect(err.message).to.equal('Unable to find value for key[fake.path]')
        })
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', async () => {
        return dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          throw new Error(`Unable to retrieve key[test-secret]. Should reject when Vault not configured`)
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve key[test-secret]. No resolver found.')
        })
      })
    })
  })
})
