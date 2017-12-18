import { expect } from 'code'
import * as Lab from 'lab'
import { toConsulOptionMap } from '../../main/DynamicConfig'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('DynamicConfig', () => {
  describe('toConsulOptionMap', () => {
    it('should return an object representing Consul request', async () => {
      const actual = toConsulOptionMap('consul!/password?dc=dc1&keys=true')
      const expected = {
        key: 'password',
        dc: 'dc1',
        keys: 'true',
      }

      expect(actual).to.equal(expected)
    })
  })
})
