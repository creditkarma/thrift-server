import { assert } from 'chai'
import { execSync } from 'child_process'
import { VaultService } from '../../main/VaultService'
import { IHVConfig } from '../../main/types'
import { cleanLastChar } from '../../main/discovery'

describe('VaultService', () => {

  const mockConfig: IHVConfig = {
    apiVersion: 'v1',
    destination: 'http://localhost:8200',
    namespace: '',
    tokenPath: ''
  }
  const service = new VaultService(mockConfig)
  const mockObj = { value: 'bar' }
  const token: string = cleanLastChar(execSync('curl localhost:8201/client-token').toString())

  describe('status', () => {
    it('should read the satus as { intialized: true }', (done) => {
      service.status().then((res) => {
        assert.deepEqual(res, { initialized: true })
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('sealStatus', () => {
    it('should correctly get seal status of vault', (done) => {
      service.sealStatus().then((res) => {
        assert.equal(res.sealed, false)
        assert.containsAllKeys(res, ['sealed','t','n','progress','version'])
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('write', () => {
    it('should write a secret to hvault', (done) => {
      service.write('secret/mock', mockObj, token).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('list', () => {
    it('should list all secret names', (done) => {
      service.list(token).then((res: any) => {
        assert.ok(res.data.keys.indexOf('mock') > -1)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('read', () => {
    it('should read an object from hvault', (done) => {
      service.read('secret/mock', token).then((res: any) => {
        assert.deepEqual(res.data, mockObj)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })
})
