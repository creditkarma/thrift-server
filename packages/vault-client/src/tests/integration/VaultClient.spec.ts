import { assert } from 'chai'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { VaultClient } from '../../main/VaultClient'
import { IHVConfig } from '../../main/types'
import { cleanLastChar } from '../../main/discovery'

describe('VaultClient', () => {

  const mockConfig: IHVConfig = {
    apiVersion: 'v1',
    destination: 'http://localhost:8200',
    namespace: 'secret',
    tokenPath: '/tmp/token',
  }
  const client: VaultClient = new VaultClient(mockConfig)
  const mockStr = 'test'
  const mockNum = 5
  const mockBool = true
  const mockObj = { value: 'bar' }
  const token: string = cleanLastChar(execSync('curl localhost:8201/client-token').toString())

  // Client expects the token to be available in the local file system
  before((done) => {
    fs.writeFile(mockConfig.tokenPath, token, (err: any) => {
      done()
    })
  })

  describe('set', () => {
    it('should write an string to hvault', (done) => {
      client.set('str', mockStr).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write an number to hvault', (done) => {
      client.set('num', mockNum).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write an boolean to hvault', (done) => {
      client.set('bool', mockBool).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write an object to hvault', (done) => {
      client.set('obj', mockObj).then((res: any) => {
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('get', () => {
    it('should read a string from hvault', (done) => {
      client.get('str').then((res: any) => {
        assert.equal(res, mockStr)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read a number from hvault', (done) => {
      client.get('num').then((res: any) => {
        assert.equal(res, mockNum)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read a boolean from hvault', (done) => {
      client.get('bool').then((res: any) => {
        assert.equal(res, mockBool)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read an object from hvault', (done) => {
      client.get('obj').then((res: any) => {
        assert.deepEqual(res, mockObj)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  after((done) => {
    fs.unlink(mockConfig.tokenPath, (err) => {
      done()
    })
  })
})
