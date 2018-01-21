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
    it('should write a string to consul', async () => {
      return client.set({ path: 'str' }, mockStr).then((val: any) => {
        expect(val).to.equal(true)
      })
    })

    it('should write a number to consul', async () => {
      return client.set({ path: 'num' }, mockNum).then((val: any) => {
        expect(val).to.equal(true)
      })
    })

    it('should write a boolean to consul', async () => {
      return client.set({ path: 'bool' }, mockBool).then((val: any) => {
        expect(val).to.equal(true)
      })
    })

    it('should write an object to consul', async () => {
      return client.set({ path: 'obj' }, mockObj).then((val: any) => {
        expect(val).to.equal(true)
      })
    })
  })

  describe('read', () => {
    it('should read a string from consul', async () => {
      client.get({ path: 'str' }).then((val: any) => {
        expect(val).to.equal(mockStr)
      })
    })

    it('should read a number from consul', async () => {
      client.get({ path: 'num' }).then((val: any) => {
        expect(val).to.equal(mockNum)
      })
    })

    it('should read a boolean from consul', async () => {
      return client.get({ path: 'bool' }).then((val: any) => {
        expect(val).to.equal(mockBool)
      })
    })

    it('should read an object from consul', async () => {
      return client.get({ path: 'obj' }).then((val: any) => {
        expect(val).to.equal(mockObj)
      })
    })

    it('should return null for a missing key', async () => {
      return client.get({ path: 'missing' }).then((val: any) => {
        expect(val).to.equal(null)
      })
    })
  })

  describe('delete', () => {
    it('should delete a string from consul', async () => {
      return client.delete({ path: 'str' }).then((result: any) => {
        expect(result).to.equal(true)
        return client.get({ path: 'str' }).then((val: any) => {
          expect(val).to.equal(null)
        })
      })
    })

    it('should delete a number from consul', async () => {
      return client.delete({ path: 'num' }).then((result: any) => {
        expect(result).to.equal(true)
        return client.get({ path: 'num' }).then((val: any) => {
          expect(val).to.equal(null)
        })
      })
    })

    it('should delete a boolean from consul', async () => {
      return client.delete({ path: 'bool' }).then((result: any) => {
        expect(result).to.equal(true)
        return client.get({ path: 'bool' }).then((val: any) => {
          expect(val).to.equal(null)
        })
      })
    })

    it('should delete an object from consul', async () => {
      return client.delete({ path: 'obj' }).then((result: any) => {
        expect(result).to.equal(true)
        return client.get({ path: 'obj' }).then((val: any) => {
          expect(val).to.equal(null)
        })
      })
    })

    it('should return true for a missing key', async () => {
      return client.delete({ path: 'missing' }).then((result: any) => {
        expect(result).to.equal(true)
      })
    })
  })
})
