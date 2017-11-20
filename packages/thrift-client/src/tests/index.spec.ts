import {
  createClient,
  fromAxios,
  fromRequest,
  HttpConnection,
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
  let server: any

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    setTimeout(done, 1000)
  })

  describe('AxiosConnection', () => {
    let connection: HttpConnection<Calculator.Client<AxiosRequestConfig>, AxiosRequestConfig>
    let client: Calculator.Client<AxiosRequestConfig>

    before((done: any) => {
      const requestClient: AxiosInstance = axios.create()
      connection = fromAxios(requestClient, SERVER_CONFIG)
      client = createClient(Calculator.Client, connection)
      done()
    })

    it('should corrently handle a service client request', (done: any) => {
      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
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
      const badConnection: HttpConnection<Calculator.Client<AxiosRequestConfig>, AxiosRequestConfig> =
        fromAxios(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return500',
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = createClient(Calculator.Client, badConnection)

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
      const badConnection: HttpConnection<Calculator.Client<AxiosRequestConfig>, AxiosRequestConfig> =
        fromAxios(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return400',
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = createClient(Calculator.Client, badConnection)

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
      const requestClient: AxiosInstance = axios.create()
      const badConnection: HttpConnection<Calculator.Client<AxiosRequestConfig>, AxiosRequestConfig> =
        fromAxios(requestClient, {
          hostName: 'fakehost',
          port: 8080,
        })
      const badClient: Calculator.Client<AxiosRequestConfig> = createClient(Calculator.Client, badConnection)

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
    let connection: HttpConnection<Calculator.Client<CoreOptions>, CoreOptions>
    let client: Calculator.Client<CoreOptions>

    before((done: any) => {
      const requestClient: RequestInstance = request.defaults({})
      connection = fromRequest(requestClient, SERVER_CONFIG)
      client = createClient(Calculator.Client, connection)
      done()
    })

    it('should corrently handle a service client request', (done: any) => {
      client.add(5, 7)
        .then((response: number) => {
          expect(response).to.equal(12)
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
      const badConnection: HttpConnection<Calculator.Client<CoreOptions>, CoreOptions> =
        fromRequest(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return500',
        })
      const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, badConnection)

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
      const badConnection: HttpConnection<Calculator.Client<CoreOptions>, CoreOptions> =
        fromRequest(requestClient, {
          hostName: SERVER_CONFIG.hostName,
          port: SERVER_CONFIG.port,
          path: '/return400',
        })
      const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, badConnection)

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
      const requestClient: RequestInstance = request.defaults({})
      const badConnection: HttpConnection<Calculator.Client<CoreOptions>, CoreOptions> =
        fromRequest(requestClient, {
          hostName: 'fakehost',
          port: 8080,
        })
      const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, badConnection)

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
      const requestClient: RequestInstance = request.defaults({})
      const badConnection: HttpConnection<Calculator.Client<CoreOptions>, CoreOptions> =
        fromRequest(requestClient, {
          hostName: 'fakehost',
          port: 8080,
        })
      const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, badConnection)

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
