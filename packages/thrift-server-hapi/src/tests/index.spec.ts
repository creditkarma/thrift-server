import {
  createHttpClient,
  createHttpConnection,
  HttpConnection,
} from 'thrift'

import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'

import {
  SERVER_CONFIG,
} from './config'

import {
  Calculator,
} from './generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Server Hapi', () => {
  let server: any
  let connection: HttpConnection
  let client: Calculator.Client

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    connection = createHttpConnection(SERVER_CONFIG.hostName, SERVER_CONFIG.port)
    client = createHttpClient(Calculator.Client, connection)

    setTimeout(done, 1000)
  })

  it('should corrently handle a service client request', (done: any) => {
    client.add(5, 7)
      .then((response: number) => {
        expect(response).to.equal(12)
        done()
      })
  })

  it('should handle requests not pointed to thrift service', (done: any) => {
    childProcess.exec(`curl http://${SERVER_CONFIG.hostName}:${SERVER_CONFIG.port}/control`, (err, stout, sterr) => {
      expect(stout).to.equal('PASS')
      done()
    })
  })

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
