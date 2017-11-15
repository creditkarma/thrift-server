import { assert } from 'chai'
import { resolveConfigs } from '../../main/resolve'

describe('resolveConfigs', () => {
  it('should override base values with update values', () => {
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

    const expectedConfig = {
      protocol: 'http',
      destination: '127.0.0.1:8200',
      hostHeader: 'hvault.com',
      sslValidation: true,
      namespace: '/your-group/your-service',
      tokenPath: '/tmp/test-token',
    }

    const actualConfig = resolveConfigs(baseConfig, updateConfig)

    assert.deepEqual(expectedConfig, actualConfig)
  })

  it('should correctly handle nested objects', () => {
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

    const expectedConfig = {
      serviceName: 'test-development',
      lru: {
        max: 500,
        maxAge: 480000,
      },
    }

    const actualConfig = resolveConfigs(baseConfig, updateConfig)

    assert.deepEqual(expectedConfig, actualConfig)
  })
})
