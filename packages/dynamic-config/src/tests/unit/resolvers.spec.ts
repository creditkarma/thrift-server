import { expect } from 'code'
import * as Lab from 'lab'

import * as ConsulResolver from '../../main/resolvers/consul'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Resolvers', () => {
  describe('ConsulResolver', () => {
    describe('toRemoteOptionMap', () => {
      it('should return an object representing Consul request', async () => {
        const actual = ConsulResolver.toRemoteOptionMap('password?dc=dc1&keys=true')
        const expected = {
          key: 'password',
          dc: 'dc1',
          keys: 'true',
        }

        expect(actual).to.equal(expected)
      })
    })
  })
})
