import { expect } from 'code'
import * as Lab from 'lab'
import { ConfigLoader } from '../../main/'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach

describe('ConfigLoader', () => {

  before((done) => {
    process.chdir(__dirname)
    done()
  })

  describe('resolve', () => {
    let savedEnv: string | undefined

    beforeEach((done) => {
      savedEnv = process.env.NODE_ENV
      done()
    })

    afterEach((done) => {
      process.env.NODE_ENV = savedEnv
      done()
    })

    it('should return the correct config for development', (done) => {
      process.env.NODE_ENV = 'development'
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/control',
            response: 'PASS',
          },
        },
        database: {
          username: 'root',
          password: 'root',
        },
      }

      loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should return the correct config for production', (done) => {
      process.env.NODE_ENV = 'production'
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/check',
            response: 'PASS',
          },
        },
        database: {
          username: 'foo',
          password: 'bar',
        },
      }

      loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should only load default config if file for NODE_ENV does not exist', (done) => {
      process.env.NODE_ENV = 'integration'
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/check',
            response: 'GOOD',
          },
        },
        database: {
          username: 'root',
          password: 'root',
        },
      }

      loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })

    it('should default to loading development config', (done) => {
      process.env.NODE_ENV = ''
      const loader: ConfigLoader = new ConfigLoader()
      const expected: any = {
        project: {
          health: {
            control: '/control',
            response: 'PASS',
          },
        },
        database: {
          username: 'root',
          password: 'root',
        },
      }

      loader.resolve().then((actual: any) => {
        expect(actual).to.equal(expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      }).catch(done)
    })
  })
})
