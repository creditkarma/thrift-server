import { assert } from 'chai'
import * as path from 'path'

import { DynamicConfig } from '../../main/DynamicConfig'

describe('DynamicConfig', () => {
  const dynamicConfig: DynamicConfig = new DynamicConfig({
    configEnv: 'development',
    configPath: path.resolve(__dirname, './config'),
    consulAddress: 'http://localhost:8500',
    consulKeys: 'test',
    consulKvDc: 'dc1',
  })

  describe('get', () => {
    it('should return the value from Consul if available', (done) => {
      dynamicConfig.get<string>('database.username').then((val: string) => {
        assert.equal(val, 'testUser')
        done()
      }).catch(done)
    })

    it('should fallback to returning from local config', (done) => {
      dynamicConfig.get<object>('project.health').then((val: object) => {
        assert.deepEqual(val, {
          control: '/control',
          response: 'PASS',
        })

        done()
      }).catch(done)
    })

    it('should reject for a missing key', (done) => {
      dynamicConfig.get<object>('fake.path').then((val: object) => {
        done(new Error('Should reject for missing key'))
      }, (err: any) => {
        assert.equal(err.message, 'Unable to retrieve value for key: fake.path')
        done()
      }).catch(done)
    })
  })
})
