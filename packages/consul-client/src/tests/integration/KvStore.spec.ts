import { expect } from 'code'
import * as Lab from 'lab'
import { KvStore } from '../../main/KvStore'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('KvStore', () => {
  const client = new KvStore('http://127.0.0.1:8500')
  const mockObj = { value: 'bar' }
  const mockStr = 'test me'
  const mockNum = 5
  const mockBool = true

  describe('write', () => {
    it('should write a string to consul', (done) => {
      client.set({ path: 'str' }, mockStr).then((val: any) => {
        expect(val).to.equal(true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write a number to consul', (done) => {
      client.set({ path: 'num' }, mockNum).then((val: any) => {
        expect(val).to.equal(true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write a boolean to consul', (done) => {
      client.set({ path: 'bool' }, mockBool).then((val: any) => {
        expect(val).to.equal(true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should write an object to consul', (done) => {
      client.set({ path: 'obj' }, mockObj).then((val: any) => {
        expect(val).to.equal(true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })

  describe('read', () => {
    it('should read a string from consul', (done) => {
      client.get({ path: 'str' }).then((val: any) => {
        expect(val).to.equal(mockStr)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read a number from consul', (done) => {
      client.get({ path: 'num' }).then((val: any) => {
        expect(val).to.equal(mockNum)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read a boolean from consul', (done) => {
      client.get({ path: 'bool' }).then((val: any) => {
        expect(val).to.equal(mockBool)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should read an object from consul', (done) => {
      client.get({ path: 'obj' }).then((val: any) => {
        expect(val).to.equal(mockObj)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })

    it('should return null for a missing key', (done) => {
      client.get({ path: 'missing' }).then((val: any) => {
        expect(val).to.equal(null)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
    })
  })
})
