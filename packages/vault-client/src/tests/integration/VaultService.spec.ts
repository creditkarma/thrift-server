import { expect } from 'code'
import * as Lab from 'lab'
import { execSync } from 'child_process'
import { VaultService } from '../../main/VaultService'
import { IHVConfig } from '../../main/types'
import { cleanLastChar } from '../../main/discovery'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('VaultService', () => {

  const mockConfig: IHVConfig = {
    apiVersion: 'v1',
    destination: 'http://localhost:8200',
    mount: 'secret',
    namespace: '',
    tokenPath: '',
    requestOptions: {},
  }
  const service = new VaultService(mockConfig)
  const mockObj = { value: 'bar' }
  const token: string = cleanLastChar(execSync('curl localhost:8201/client-token').toString())

  describe('status', () => {
    it('should read the satus as { intialized: true }', (done) => {
      service.status().then((res) => {
        expect(res).to.equal({ initialized: true })
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('sealStatus', () => {
    it('should correctly get seal status of vault', (done) => {
      service.sealStatus().then((res) => {
        expect(res.sealed).to.equal(false)
        expect(res).to.include(['sealed','t','n','progress','version'])
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('write', () => {
    it('should write a secret to hvault', (done) => {
      service.write('secret/mock', mockObj, token).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('list', () => {
    it('should list all secret names', (done) => {
      service.list(token).then((res: any) => {
        expect(res.data.keys).to.include('mock')
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('read', () => {
    it('should read an object from hvault', (done) => {
      service.read('secret/mock', token).then((res: any) => {
        expect(res.data).to.equal(mockObj)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })
})
