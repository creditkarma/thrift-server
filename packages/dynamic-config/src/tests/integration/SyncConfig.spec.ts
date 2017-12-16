import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import { SyncConfig } from '../../main/SyncConfig'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before

describe('SyncConifg', () => {

  before((done) => {
    process.chdir(__dirname)
    done()
  })

  describe('Configured with Vault and Consul', () => {
    let syncConfig: SyncConfig

    before(async () => {
      syncConfig = await SyncConfig.getSyncConfig({
        configEnv: 'development',
        configPath: path.resolve(__dirname, './config'),
        consulAddress: 'http://localhost:8510',
        consulKeys: 'test-config-one,with-vault',
        consulKvDc: 'dc1',
      })
    })

    describe('get', () => {
      it('should return full config when making empty call to get', (done) => {
        const actual = syncConfig.get<object>()
        const expected = {
          database: {
            username: 'testUser',
            password: 'vault!/password',
          },
          project: {
            health: {
              control: '/control',
              response: 'PASS',
            },
          },
          'hashicorp-vault': {
            apiVersion: 'v1',
            destination: 'http://localhost:8210',
            mount: 'secret',
            tokenPath: './tmp/token',
          },
        }

        expect(actual).to.equal(expected)
        done()
      })

      it('should return the value from Consul if available', (done) => {
        const actual = syncConfig.get<string>('database.username')
        const expected = 'testUser'
        expect(actual).to.equal(expected)
        done()
      })

      it('should fallback to returning from local config', (done) => {
        const actual = syncConfig.get<object>('project.health')
        const expected = {
          control: '/control',
          response: 'PASS',
        }
        expect(actual).to.equal(expected)
        done()
      })

      it('should return null for a missing key', (done) => {
        const actual = syncConfig.get<object>('fake.path')
        const expected = null
        expect(actual).to.equal(expected)
        done()
      })
    })

    describe('getSecretValue', () => {
      it('should get secret value from Vault', (done) => {
        syncConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          expect(actual).to.equal('this is a secret')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing secret', (done) => {
        syncConfig.getSecretValue<string>('missing-secret').then((actual: string) => {
          done(new Error('Should reject for missing secret'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Vault failed with error: Unable to locate vault resource at: http://localhost:8210/v1/secret/missing-secret',
          )
          done()
        }).catch(done)
      })
    })
  })

  describe('Configured with Consul', () => {
    let syncConfig: SyncConfig

    before(async () => {
      syncConfig = await SyncConfig.getSyncConfig({
        configEnv: 'development',
        configPath: path.resolve(__dirname, './config'),
        consulAddress: 'http://localhost:8510',
        consulKeys: 'test-config-one',
        consulKvDc: 'dc1',
      })
    })

    describe('get', () => {
      it('should return full config when making empty call to get', (done) => {
        const actual = syncConfig.get<object>()
        const expected = {
          database: {
            username: 'testUser',
            password: 'consul!/password',
          },
          project: {
            health: {
              control: '/control',
              response: 'PASS',
            },
          },
        }
        expect(actual).to.equal(expected)
        done()
      })

      it('should return the value from Consul if available', (done) => {
        const actual = syncConfig.get<string>('database.username')
        const expected = 'testUser'
        expect(actual).to.equal(expected)
        done()
      })

      it('should fallback to returning from local config', (done) => {
        const actual = syncConfig.get<object>('project.health')
        const expected = {
          control: '/control',
          response: 'PASS',
        }
        expect(actual).to.equal(expected)
        done()
      })

      it('should reject for a missing key', (done) => {
        const actual = syncConfig.get<object>('fake.path')
        expect(actual).to.equal(null)
        done()
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        syncConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          done(new Error('Should reject when Vault not configured'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Unable to retrieve key: test-secret. Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })

  describe('Without Consul or Vault Configured', () => {
    let syncConfig: SyncConfig
    before(async () => {
      syncConfig = await SyncConfig.getSyncConfig({
        configEnv: 'development',
        configPath: path.resolve(__dirname, './config'),
      })
    })

    describe('get', () => {
      it('should return the value from local config', (done) => {
        const actual = syncConfig.get<string>('database.username')
        expect(actual).to.equal('root')
        done()
      })

      it('should fallback to returning from local config', (done) => {
        const actual = syncConfig.get<object>('project.health')
        expect(actual).to.equal({
          control: '/control',
          response: 'PASS',
        })

        done()
      })

      it('should return null for a missing key', (done) => {
        const actual = syncConfig.get<object>('fake.path')
        expect(actual).to.equal(null)
        done()
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        syncConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          done(new Error('Should reject when Vault not configured'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Unable to retrieve key: test-secret. Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })
})
