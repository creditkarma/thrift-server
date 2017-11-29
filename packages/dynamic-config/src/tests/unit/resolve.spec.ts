import { expect } from 'code'
import * as Lab from 'lab'
import { resolveConfigs } from '../../main/resolve'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('resolveConfigs', () => {
  it('should override base values with update values', (done) => {
    const baseConfig = {
      protocol: 'https',
      destination: '127.0.0.1:9000',
      hostHeader: 'hvault.com',
      sslValidation: false,
      namespace: '/your-group/your-service',
      tokenPath: '/tmp/test-token',
    }

    const updateConfig = {
      protocol: 'http',
      destination: '127.0.0.1:8200',
      hostHeader: 'hvault.com',
      sslValidation: true,
    }

    const expected = {
      protocol: 'http',
      destination: '127.0.0.1:8200',
      hostHeader: 'hvault.com',
      sslValidation: true,
      namespace: '/your-group/your-service',
      tokenPath: '/tmp/test-token',
    }

    const actual = resolveConfigs(baseConfig, updateConfig)

    expect(actual).to.equal(expected)
    done()
  })

  it('should correctly handle nested objects', (done) => {
    const baseConfig = {
      serviceName: 'test',
      lru: {
        max: 500,
        maxAge: 3600000,
      },
    }

    const updateConfig = {
      serviceName: 'test-development',
      lru: {
        maxAge: 480000,
      },
    }

    const expected = {
      serviceName: 'test-development',
      lru: {
        max: 500,
        maxAge: 480000,
      },
    }

    const actual = resolveConfigs(baseConfig, updateConfig)

    expect(actual).to.equal(expected)
    done()
  })
})
