import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'
import {
  createHttpClient,
  createHttpConnection,
  HttpConnection,
} from 'thrift'

import {
  Calculator,
} from './generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

const config = {
  hostName: 'localhost',
  port: 8080,
}

describe('Thrift Server Express', () => {
    let server: any
    let connection: HttpConnection
    let client: Calculator.Client

    before((done: any) => {
        server = childProcess.fork('./dist/tests/server.js')
        server.on('message', (msg: any) => console.log(msg))
        connection = createHttpConnection(config.hostName, config.port, {
            path: '/thrift',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        })
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
        childProcess.exec(
            `curl http://${config.hostName}:${config.port}/control`,
            (err, stout, sterr) => {
                expect(stout).to.equal('PASS')
                done()
            },
        )
    })

    after((done: any) => {
        server.kill('SIGHUP')
        done()
    })
})
