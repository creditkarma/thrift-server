import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'
import * as request from 'request'
import { CoreOptions } from 'request'

import {
  fromRequest,
  RequestConnection,
  RequestInstance,
} from '@creditkarma/thrift-client'

import {
  SERVER_CONFIG,
} from './config'

import {
  Calculator,
} from './generated/calculator/calculator'

import {
  SharedStruct,
} from './generated/shared/shared'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Server Express', () => {
  let server: any
  let connection: RequestConnection
  let client: Calculator.Client<CoreOptions>

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))

    const requestClient: RequestInstance = request.defaults({})
    connection = fromRequest(requestClient, SERVER_CONFIG)
    client = new Calculator.Client(connection)

    setTimeout(done, 1000)
  })

  it('should corrently handle a service client request', (done: any) => {
    client.add(5, 7)
      .then((response: number) => {
        expect(response).to.equal(12)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
  })

  it('should corrently handle a service client request for a struct', (done: any) => {
    client.getStruct(1)
      .then((response: SharedStruct) => {
        const expected = new SharedStruct({
          key: 0,
          value: 'test',
        })
        expect(response).to.equal(expected)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
  })

  it('should correctly handle a service request with context', (done: any) => {
    client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'fake-token' } })
      .then((response: number) => {
        expect(response).to.equal(12)
        done()
      }, (err: any) => {
        console.log('error: ', err)
        done(err)
      })
  })

  it('should reject service call with incorrect context', (done: any) => {
    client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'wrong' } })
      .then((response: number) => {
        expect(true).to.equal(false)
        done()
      }, (err: any) => {
        expect(true).to.equal(true)
        done()
      })
  })

  it('should handle requests not pointed to thrift service', (done: any) => {
    childProcess.exec(
      `curl http://${SERVER_CONFIG.hostName}:${SERVER_CONFIG.port}/control`,
      (err, stout, sterr) => {
        expect(stout).to.equal('PASS')
        done()
      },
    )
  })

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
