import { expect } from 'code'
import * as Lab from 'lab'
import * as path from 'path'

import { DynamicConfig } from '../../main/'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before

describe('DynamicConfig', () => {

  before((done) => {
    process.chdir(__dirname)
    done()
  })

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
        dynamicConfig.get().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'vault!/password',
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
              mount: 'secret',
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
        dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('testUser')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fetch value from Vault when value is Vault placeholder', (done) => {
        dynamicConfig.get<string>('database.password').then((actual: string) => {
          expect(actual).to.equal('K1ndaS3cr3t')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
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
        dynamicConfig.get<object>('fake.path').then((actual: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should get secret value from Vault', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          expect(actual).to.equal('this is a secret')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should reject for a missing secret', (done) => {
        dynamicConfig.getSecretValue<string>('missing-secret').then((actual: string) => {
          done(new Error('Should reject for missing secret'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Vault failed with error: Unable to locate vault resource at: http://localhost:8210/v1/secret/missing-secret',
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
        dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'consul!/password',
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
        dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('testUser')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fetch value from Consul when value is Consul placeholder', (done) => {
        dynamicConfig.get<string>('database.password').then((actual: string) => {
          expect(actual).to.equal('Sup3rS3cr3t')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should mutate config after getting new data from Consul', (done) => {
        dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'testUser',
              password: 'Sup3rS3cr3t',
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

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
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
        dynamicConfig.get<object>('fake.path').then((actual: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          done(new Error('Should reject when Vault not configured'))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Unable to retrieve key: test-secret. Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })

  describe('Configured with Overlayed Consul Configs', () => {
    const dynamicConfig: DynamicConfig = new DynamicConfig({
      configEnv: 'development',
      configPath: path.resolve(__dirname, './config'),
      consulAddress: 'http://localhost:8510',
      consulKeys: 'test-config-one,test-config-two',
      consulKvDc: 'dc1',
    })

    describe('get', () => {
      it('should return full config when making empty call to get', (done) => {
        dynamicConfig.get<string>().then((actual: any) => {
          expect(actual).to.equal({
            database: {
              username: 'fakeUser',
              password: {
                key: 'consul!/missing-password',
                default: 'NotSoSecret',
              },
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

      it('should return default value if unable to get from Consul', (done) => {
        dynamicConfig.get<string>('database.password').then((actual: any) => {
          expect(actual).to.equal('NotSoSecret')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
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
        dynamicConfig.get<string>('database.username').then((actual: string) => {
          expect(actual).to.equal('root')
          done()
        }, (err: any) => {
          console.log('error: ', err)
          done(err)
        }).catch(done)
      })

      it('should fallback to returning from local config', (done) => {
        dynamicConfig.get<object>('project.health').then((actual: object) => {
          expect(actual).to.equal({
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
        dynamicConfig.get<object>('fake.path').then((actual: object) => {
          done(new Error('Should reject for missing key'))
        }, (err: any) => {
          expect(err.message).to.equal('Unable to retrieve value for key: fake.path')
          done()
        }).catch(done)
      })
    })

    describe('getSecretValue', () => {
      it('should reject when Vault not configured', (done) => {
        dynamicConfig.getSecretValue<string>('test-secret').then((actual: string) => {
          done(new Error(`Unable to retrieve key: 'test-secret'. Should reject when Vault not configured`))
        }, (err: any) => {
          expect(err.message).to.equal(
            'Unable to retrieve key: test-secret. Hashicorp Vault is not configured',
          )
          done()
        }).catch(done)
      })
    })
  })
})
