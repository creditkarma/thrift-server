import {
  AxiosConnection,
  fromAxios,
  fromRequest,
  RequestConnection,
  RequestInstance,
} from '../main'

import {
  AxiosInstance,
  AxiosRequestConfig,
  default as axios,
} from 'axios'

import * as request from 'request'
import { CoreOptions } from 'request'

import {
  SERVER_CONFIG,
} from './config'

import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'

import {
  Calculator,
} from './generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Client', () => {
  let server: childProcess.ChildProcess

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    setTimeout(done, 2000)
  })

  describe('AxiosConnection', () => {
    let connection: AxiosConnection
    let client: Calculator.Client<AxiosRequestConfig>

    before((done: any) => {
      const requestClient: AxiosInstance = axios.create()
      connection = fromAxios(requestClient, SERVER_CONFIG)
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
        .then((response: any) => {
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
      const requestClient: AxiosInstance = axios.create()
      const badConnection: AxiosConnection =
        fromAxios(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return500',
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = new Calculator.Client(badConnection)

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
      const requestClient: AxiosInstance = axios.create()
      const badConnection: AxiosConnection =
        fromAxios(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return400',
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = new Calculator.Client(badConnection)

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
      const requestClient: AxiosInstance = axios.create({ timeout: 5000 })
      const badConnection: AxiosConnection =
        fromAxios(requestClient, {
          hostName: 'fakehost',
          port: 8080,
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = new Calculator.Client(badConnection)

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

  describe('RequestConnection', () => {
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

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
