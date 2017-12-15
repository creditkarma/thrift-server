import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import { DynamicConfig, getConfig } from '../../main/'

import {
  CONFIG_PATH,
  CONSUL_ADDRESS,
  CONSUL_KEYS,
  CONSUL_KV_DC,
} from '../../main/constants'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('DynamicConfig Singleton', () => {
  let config: DynamicConfig

  before((done) => {
    process.chdir(__dirname)

    // Set environment options for DynamicConfig
    process.env[CONFIG_PATH] = path.resolve(__dirname, './config')
    process.env[CONSUL_ADDRESS] = 'http://localhost:8510'
    process.env[CONSUL_KV_DC] = 'dc1'
    process.env[CONSUL_KEYS] = 'test-config-one,with-vault'

    // Get our config singleton
    config = getConfig()
    done()
  })

  after((done) => {
    // Reset environment options for DynamicConfig
    process.env[CONFIG_PATH] = undefined
    process.env[CONSUL_ADDRESS] = undefined
    process.env[CONSUL_KV_DC] = undefined
    process.env[CONSUL_KEYS] = undefined
    done()
  })

  describe('get', () => {
    it('should return the value from Consul if available', (done) => {
      config.get<string>('database.username').then((val: string) => {
        expect(val).to.equal('testUser')
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should fallback to returning from local config', (done) => {
      config.get<object>('project.health').then((val: object) => {
        expect(val).to.equal({
          control: '/control',
          response: 'PASS',
        })

        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should reject for a missing key', (done) => {
      config.get<object>('fake.path').then((val: object) => {
        done(new Error('Should reject for missing key'))
      }, (err: any) => {
        expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
        done()
      }).catch(done)
    })
  })

  describe('getSecretValue', () => {
    it('should get secret value from Vault', (done) => {
      config.getSecretValue<string>('test-secret').then((val: string) => {
        expect(val).to.equal('this is a secret')
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should reject for a missing secret', (done) => {
      config.getSecretValue<string>('missing-secret').then((val: string) => {
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
