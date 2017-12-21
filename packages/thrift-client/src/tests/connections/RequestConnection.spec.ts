import {
  fromRequest,
  RequestConnection,
  RequestInstance,
} from '../../main'

import * as request from 'request'
import { CoreOptions } from 'request'

import {
  SERVER_CONFIG,
} from '../config'

import {
  readThriftMethod,
} from '../../main/utils'

import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'

import {
  Calculator,
} from '../generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('RequestConnection', () => {
  let server: childProcess.ChildProcess

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    setTimeout(done, 2000)
  })

  describe('Basic Usage', () => {
    let connection: RequestConnection
    let client: Calculator.Client<CoreOptions>

    before((done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      connection = fromRequest(requestClient, SERVER_CONFIG)
      client = new Calculator.Client(connection)
      done()
    })

    it('should corrently handle a service client request', (done: any) => {
      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should corrently handle a void service client request', (done: any) => {
      client.ping()
        .then((response: any) => {
          expect(response).to.equal(undefined)
          done()
        })
    })

    it('should corrently handle a service client request that returns a struct', (done: any) => {
      client.getStruct(5)
        .then((response: { key: number, value: string }) => {
          expect(response).to.equal({ key: 0, value: 'test' })
          done()
        })
    })

    it('should corrently handle a service client request that returns a union', (done: any) => {
      client.getUnion(1)
        .then((response: any) => {
          expect(response).to.equal({ option1: 'foo' })
          done()
        })
    })

    it('should allow passing of a request context', (done: any) => {
      client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'fake-token' } })
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should reject auth request without context', (done: any) => {
      client.addWithContext(5, 7)
        .then((response: number) => {
          expect(false).to.equal(true)
          done()
        }, (err: any) => {
          expect(err.message).to.equal('Unauthorized')
          done()
        })
    })

    it('should reject for a 500 server response', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const badConnection: RequestConnection =
        fromRequest(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return500',
        })
      const badClient: Calculator.Client<CoreOptions> = new Calculator.Client(badConnection)

      badClient.add(5, 7)
        .then((response: number) => {
          expect(false).to.equal(true)
          done()
        }, (err: any) => {
          expect(true).to.equal(true)
          done()
        })
    })

    it('should reject for a 400 server response', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const badConnection: RequestConnection =
        fromRequest(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return400',
        })
      const badClient: Calculator.Client<CoreOptions> = new Calculator.Client(badConnection)

      badClient.add(5, 7)
        .then((response: number) => {
          expect(false).to.equal(true)
          done()
        }, (err: any) => {
          expect(true).to.equal(true)
          done()
        })
    })

    it('should reject for a request to a missing service', (done: any) => {
      const requestClient: RequestInstance = request.defaults({ timeout: 5000 })
      const badConnection: RequestConnection =
        fromRequest(requestClient, {
          hostName: 'fakehost',
          port: 8080,
        })
      const badClient: Calculator.Client<CoreOptions> = new Calculator.Client(badConnection)

      badClient.add(5, 7)
        .then((response: number) => {
          expect(false).to.equal(true)
          done()
        }, (err: any) => {
          expect(true).to.equal(true)
          done()
        })
    })
  })

  describe('IncomingMiddleware', () => {
    it('should resolve when middleware allows', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        handler(data: Buffer): Promise<Buffer> {
          if (readThriftMethod(data) === 'add') {
            return Promise.resolve(data)
          } else {
            return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
          }
        },
      })

      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should resolve when middleware passes method filter', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        methods: [ 'add' ],
        handler(data: Buffer): Promise<Buffer> {
          console.log('data: ', data)
          if (readThriftMethod(data) === 'add') {
            return Promise.resolve(data)
          } else {
            return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
          }
        },
      })

      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should reject when middleware rejects', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        handler(data: Buffer): Promise<Buffer> {
          if (readThriftMethod(data) === 'nope') {
            return Promise.resolve(data)
          } else {
            return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
          }
        },
      })

      client.add(5, 7)
        .then((response: number) => {
          done(new Error(`Mehtods should fail when middleware rejects`))
        }, (err: any) => {
          expect(err.message).to.equal('Unrecognized method name: add')
          done()
        })
    })

    it('should skip handler when middleware fails method filter', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        methods: [ 'nope' ],
        handler(data: Buffer): Promise<Buffer> {
          return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
        },
      })

      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })
  })

  describe('OutgoingMiddleware', () => {
    it('should resolve when middleware adds auth token', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        type: 'outgoing',
        handler(context: CoreOptions): Promise<CoreOptions> {
          return Promise.resolve(Object.assign({}, context, {
            headers: {
              'X-Fake-Token': 'fake-token',
            },
          }))
        },
      })

      client.addWithContext(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should resolve when middleware passes method filter', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        type: 'outgoing',
        methods: [ 'addWithContext' ],
        handler(context: CoreOptions): Promise<CoreOptions> {
          return Promise.resolve(Object.assign({}, context, {
            headers: {
              'X-Fake-Token': 'fake-token',
            },
          }))
        },
      })

      client.addWithContext(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
          done()
        })
    })

    it('should reject when middleware does not add auth token', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      client.addWithContext(5, 7)
        .then((response: number) => {
          done(new Error(`Mehtods should fail when middleware rejects`))
        }, (err: any) => {
          expect(err.message).to.equal('Unauthorized')
          done()
        })
    })

    it('should resolve when middleware fails method filter', (done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      const connection: RequestConnection = fromRequest(requestClient, SERVER_CONFIG)
      const client = new Calculator.Client(connection)

      connection.register({
        type: 'outgoing',
        methods: [ 'add' ],
        handler(context: CoreOptions): Promise<CoreOptions> {
          return Promise.resolve(Object.assign({}, context, {
            headers: {
              'X-Fake-Token': 'fake-token',
            },
          }))
        },
      })

      client.addWithContext(5, 7)
        .then((response: number) => {
          done(new Error(`Mehtods should fail when middleware rejects`))
        }, (err: any) => {
          expect(err.message).to.equal('Unauthorized')
          done()
        })
    })
  })

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
