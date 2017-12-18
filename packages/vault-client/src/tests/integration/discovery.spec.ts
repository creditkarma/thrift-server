import { expect } from 'code'
import * as Lab from 'lab'
import * as fs from 'fs'
import * as TokenDiscovery from '../../main/discovery'
import { IHVConfig } from '../../main/types'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('TokenDiscovery', () => {
  const tokenFilePath: string = '/tmp/token'
  const tokenValue: string = 'test-token'
  const mockConfig: IHVConfig = {
    apiVersion: 'v1',
    mount: 'secret',
    destination: '',
    namespace: '',
    tokenPath: tokenFilePath,
    requestOptions: {},
  }

  before((done) => {
    fs.writeFile(tokenFilePath, tokenValue, (err: any) => {
      done()
    })
  })

  describe('getToken', () => {
    it('should retrieve the token from a specified file', (done) => {
      TokenDiscovery.getToken(mockConfig).then((val: string) => {
        expect(val).to.equal(tokenValue)
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
