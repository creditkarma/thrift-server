import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import { DynamicConfig } from '../../main/'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('DynamicConfig', () => {

  describe('Configured with Vault and Consul', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      consulAddress: 'http://localhost:8510',
      consulKeys: 'test-config-one,with-vault',
      consulKvDc: 'dc1',
    })

    describe('get', () => {
      it('should return full config when making empty call to get', (done) => {
        dynamicConfig.get<string>().then((val: any) => {
          expect(val).to.equal({
            database: {
              password: 'testPass',
              username: 'testUser',
            },
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
            'hashicorp-vault': {
              apiVersion: 'v1',
              destination: 'http://localhost:8210',
              namespace: 'secret',
              tokenPath: './tmp/token',
            },
          })
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should return the value from Consul if available', (done) => {
        dynamicConfig.get<string>('database.username').then((val: string) => {
          expect(val).to.equal('testUser')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((val: object) => {
          expect(val).to.equal({
            control: '/control',
            response: 'PASS',
          })

          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing key', (done) => {
        dynamicConfig.get<object>('fake.path').then((val: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should get secret value from Vault', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((val: string) => {
          expect(val).to.equal('this is a secret')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing secret', (done) => {
        dynamicConfig.getSecretValue<string>('missing-secret').then((val: string) => {
          done(new Error('Should reject for missing secret'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Unable to locate vault resource at: http://localhost:8210/v1/secret/missing-secret',
          )
          done()
        }).catch(done)
      })
    })
  })

  describe('Configured with Consul', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      consulAddress: 'http://localhost:8510',
      consulKeys: 'test-config-one',
      consulKvDc: 'dc1',
    })

    describe('get', () => {
      it('should return full config when making empty call to get', (done) => {
        dynamicConfig.get<string>().then((val: any) => {
          expect(val).to.equal({
            database: {
              password: 'testPass',
              username: 'testUser',
            },
            project: {
              health: {
                control: '/control',
                response: 'PASS',
              },
            },
          })
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should return the value from Consul if available', (done) => {
        dynamicConfig.get<string>('database.username').then((val: string) => {
          expect(val).to.equal('testUser')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((val: object) => {
          expect(val).to.equal({
            control: '/control',
            response: 'PASS',
          })

          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing key', (done) => {
        dynamicConfig.get<object>('fake.path').then((val: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((val: string) => {
          done(new Error('Should reject when Vault not configured'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })

  describe('Without Consul or Vault Configured', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
    })

    describe('get', () => {
      it('should return the value from local config', (done) => {
        dynamicConfig.get<string>('database.username').then((val: string) => {
          expect(val).to.equal('root')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((val: object) => {
          expect(val).to.equal({
            control: '/control',
            response: 'PASS',
          })

          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing key', (done) => {
        dynamicConfig.get<object>('fake.path').then((val: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((val: string) => {
          done(new Error('Should reject when Vault not configured'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })
})
