import { assert } from 'chai'
import * as path from 'path'

import { DynamicConfig, getConfig } from '../../main/'

import {
  CONFIG_PATH,
  CONSUL_ADDRESS,
  CONSUL_KEYS,
  CONSUL_KV_DC,
} from '../../main/constants'

describe('DynamicConfig Singleton', () => {
  // Set environment options for DynamicConfig
  process.env[CONFIG_PATH] = path.resolve(__dirname, './config')
  process.env[CONSUL_ADDRESS] = 'http://localhost:8500'
  process.env[CONSUL_KV_DC] = 'dc1'
  process.env[CONSUL_KEYS] = 'test-config-one'

  // Get our config singleton
  const config: DynamicConfig = getConfig()

  describe('get', () => {
    it('should return the value from Consul if available', (done) => {
      config.get<string>('database.username').then((val: string) => {
        assert.equal(val, 'testUser')
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should fallback to returning from local config', (done) => {
      config.get<object>('project.health').then((val: object) => {
        assert.deepEqual(val, {
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
        assert.equal(err.message, 'Unable to retrieve value for key: fake.path')
        done()
      }).catch(done)
    })
  })

  describe('getSecretValue', () => {
    it('should get secret value from Vault', (done) => {
      config.getSecretValue<string>('test-secret').then((val: string) => {
        assert.equal(val, 'this is a secret')
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
        assert.equal(err.message, 'Unable to locate vault resource at: http://localhost:8200/v1/secret/missing-secret')
        done()
      }).catch(done)
    })
  })
})
