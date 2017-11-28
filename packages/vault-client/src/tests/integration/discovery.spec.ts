import { assert } from 'chai'
import * as fs from 'fs'
import * as TokenDiscovery from '../../main/discovery'
import { IHVConfig } from '../../main/types'

describe('TokenDiscovery', () => {
  const tokenFilePath: string = '/tmp/token'
  const tokenValue: string = 'test-token'
  const mockConfig: IHVConfig = {
    apiVersion: 'v1',
    destination: '',
    namespace: '',
    tokenPath: tokenFilePath
  }

  before((done) => {
    fs.writeFile(tokenFilePath, tokenValue, (err: any) => {
      done()
    })
  })

  describe('getToken', () => {
    it('should retrieve the token from a specified file', (done) => {
      TokenDiscovery.getToken(mockConfig).then((val: string) => {
        assert.equal(val, tokenValue)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  after((done) => {
    fs.unlink(tokenFilePath, (err) => {
      done()
    })
  })
})
