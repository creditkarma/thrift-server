import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import { config } from '../../main/'

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
  before(async () => {
    process.chdir(__dirname)

    // Set environment options for DynamicConfig
    process.env[CONFIG_PATH] = path.resolve(__dirname, './config')
    process.env[CONSUL_ADDRESS] = 'http://localhost:8510'
    process.env[CONSUL_KV_DC] = 'dc1'
    process.env[CONSUL_KEYS] = 'test-config-one,with-vault'
  })

  after(async () => {
    // Reset environment options for DynamicConfig
    process.env[CONFIG_PATH] = undefined
    process.env[CONSUL_ADDRESS] = undefined
    process.env[CONSUL_KV_DC] = undefined
    process.env[CONSUL_KEYS] = undefined
  })

  describe('get', () => {
    it('should return the value from Consul if available', async () => {
      return config().get<string>('database.username').then((val: string) => {
        expect(val).to.equal('testUser')
      })
    })

    it('should fallback to returning from local config', async () => {
      return config().get<object>('project.health').then((val: object) => {
        expect(val).to.equal({
          control: '/test',
          response: 'PASS',
        })
      })
    })

    it('should reject for a missing key', async () => {
      return config().get<object>('fake.path').then((val: object) => {
        throw new Error('Should reject for missing key')
      }, (err: any) => {
        expect(err.message).to.equal('Unable to find value for key: fake.path')
      })
    })
  })

  describe('getSecretValue', () => {
    it('should get secret value from Vault', async () => {
      return config().getSecretValue<string>('test-secret').then((val: string) => {
        expect(val).to.equal('this is a secret')
      })
    })

    it('should reject for a missing secret', async () => {
      return config().getSecretValue<string>('missing-secret').then((val: string) => {
        throw new Error('Should reject for missing secret')
      }, (err: any) => {
        expect(err.message).to.equal(
          'Unable to find value for key: missing-secret',
        )
      })
    })
  })
})
