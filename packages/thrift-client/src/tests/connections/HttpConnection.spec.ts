import {
  BinaryProtocol,
  BufferedTransport,
  TProtocol,
  TTransport,
} from '@creditkarma/thrift-server-core'

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

function readThriftMethod(buffer: Buffer): string {
  const transportWithData: TTransport = new BufferedTransport(buffer)
  const input: TProtocol = new BinaryProtocol(transportWithData)
  const { fieldName } = input.readMessageBegin()

  return fieldName
}

describe('HttpConnection', () => {
  let server: childProcess.ChildProcess
  let connection: RequestConnection
  let client: Calculator.Client<CoreOptions>

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    setTimeout(() => {
      const requestClient: RequestInstance = request.defaults({})
      connection = fromRequest(requestClient, SERVER_CONFIG)
      client = new Calculator.Client(connection)
      done()
    }, 2000)
  })

  describe('Middleware', () => {
    it('should resolve when middleware allows', (done: any) => {
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

    it('should reject when middleware rejects', (done: any) => {
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
  })

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
