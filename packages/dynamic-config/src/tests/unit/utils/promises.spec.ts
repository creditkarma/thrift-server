import { expect } from 'code'
import * as Lab from 'lab'

import {
  PromiseUtils,
} from '../../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('PromiseUtils', () => {
  describe('race', () => {
    it('should resolve to value of first successful Promise', async () => {
      return PromiseUtils.race([
        Promise.reject('error 1'),
        Promise.reject('error 2'),
        Promise.resolve(6),
        Promise.resolve(10),
      ]).then((actual: any) => {
        expect(actual).to.equal(6)
      })
    })

    it('should reject if all Promises reject', async () => {
      return PromiseUtils.race([
        Promise.reject('error 1'),
        Promise.reject('error 2'),
        Promise.reject('error 3'),
      ]).then((actual: any) => {
        Promise.reject(new Error('Promise should reject'))
      }, (err: any) => {
        expect(err.message).to.equal('All Promises rejected without success')
      })
    })
  })

  describe('resolveObjectPromises', () => {
    it('should resolve Promises within an object', async () => {
      const actual = await PromiseUtils.resolveObjectPromises({
        one: Promise.resolve(5),
        two: {
          three: Promise.resolve(6),
          four: 8,
          five: {
            six: Promise.resolve(9),
          },
        },
        seven: {
          eight: 90,
          nine: {
            ten: Promise.resolve(34),
          },
        },
      })

      const expected = {
        one: 5,
        two: {
          three: 6,
          four: 8,
          five: {
            six: 9,
          },
        },
        seven: {
          eight: 90,
          nine: {
            ten: 34,
          },
        },
      }

      expect(actual).to.equal(expected)
    })

    it('should reject if one of the Promises reject', async () => {
      const objectPromise = PromiseUtils.resolveObjectPromises({
        one: Promise.resolve(5),
        two: {
          three: Promise.resolve(6),
          four: 8,
          five: {
            six: Promise.reject(new Error('Unable to load value')),
          },
        },
        seven: {
          eight: 90,
          nine: {
            ten: Promise.resolve(34),
          },
        },
      })

      return objectPromise.then((value: any) => {
        throw new Error('Promise should fail')
      }, (err: any) => {
        expect(err.message).to.equal('Unable to load value')
      })
    })

    it('should resolve nested Promises', async () => {
      const actual = await PromiseUtils.resolveObjectPromises(Promise.resolve({
        one: Promise.resolve(5),
        two: {
          three: Promise.resolve(6),
          four: 8,
          five: {
            six: Promise.resolve(9),
          },
        },
        seven: Promise.resolve({
          eight: 90,
          nine: {
            ten: Promise.resolve(34),
          },
        }),
      }))

      const expected = {
        one: 5,
        two: {
          three: 6,
          four: 8,
          five: {
            six: 9,
          },
        },
        seven: {
          eight: 90,
          nine: {
            ten: 34,
          },
        },
      }

      expect(actual).to.equal(expected)
    })
  })
})
