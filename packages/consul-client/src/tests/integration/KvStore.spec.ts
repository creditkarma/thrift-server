import { assert } from 'chai'
import { KvStore } from '../../main/KvStore'

describe('KvStore', () => {
  const client = new KvStore('http://127.0.0.1:8500')
  const mockObj = { value: 'bar' }
  const mockStr = 'test me'
  const mockNum = 5
  const mockBool = true

  // This just gives consul a chance to spin up
  before((done) => {
    setTimeout(done, 3000)
  })

  describe('write', () => {
    it('should write a string to consul', (done) => {
      client.set({ path: 'str' }, mockStr).then((val: any) => {
        assert.equal(val, true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should write a number to consul', (done) => {
      client.set({ path: 'num' }, mockNum).then((val: any) => {
        assert.equal(val, true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should write a boolean to consul', (done) => {
      client.set({ path: 'bool' }, mockBool).then((val: any) => {
        assert.equal(val, true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should write an object to consul', (done) => {
      client.set({ path: 'obj' }, mockObj).then((val: any) => {
        assert.equal(val, true)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })

  describe('read', () => {
    it('should read a string from consul', (done) => {
      client.get({ path: 'str' }).then((val: any) => {
        assert.equal(val, mockStr)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should read a number from consul', (done) => {
      client.get({ path: 'num' }).then((val: any) => {
        assert.equal(val, mockNum)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should read a boolean from consul', (done) => {
      client.get({ path: 'bool' }).then((val: any) => {
        assert.equal(val, mockBool)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should read an object from consul', (done) => {
      client.get({ path: 'obj' }).then((val: any) => {
        assert.deepEqual(val, mockObj)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should return null for a missing key', (done) => {
      client.get({ path: 'missing' }).then((val: any) => {
        assert.equal(val, null)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })
})
