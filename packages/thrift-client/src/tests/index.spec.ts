import {
  createClient,
  fromAxios,
  HttpConnection,
} from '../main'

import {
  AxiosInstance,
  default as axios,
} from 'axios'

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
  let connection: HttpConnection<Calculator.Client>
  let client: Calculator.Client

  before((done: any) => {
    server = childProcess.fork('./dist/tests/server.js')
    server.on('message', (msg: any) => console.log(msg))
    const requestClient: AxiosInstance = axios.create()
    connection = fromAxios(requestClient, SERVER_CONFIG)
    client = createClient(Calculator.Client, connection)

    setTimeout(done, 1000)
  })

  it('should corrently handle a service client request', (done: any) => {
    client.add(5, 7)
      .then((response: number) => {
        expect(response).to.equal(12)
        done()
      })
  })

  after((done: any) => {
    server.kill('SIGINT')
    setTimeout(done, 1000)
  })
})
