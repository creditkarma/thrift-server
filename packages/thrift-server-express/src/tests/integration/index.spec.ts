import { exec } from 'child_process'
import { expect } from 'code'
import * as express from 'express'
import * as Lab from 'lab'
import * as net from 'net'
import { CoreOptions } from 'request'

import {
  createClient,
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

import {
    createServer,
} from './server'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Server Express', () => {
    let server: net.Server
    let client: Calculator.Client<CoreOptions>

    before((done: any) => {
        const app: express.Application = createServer()
        client = createClient(Calculator.Client, SERVER_CONFIG)

        server = app.listen(SERVER_CONFIG.port, () => {
            console.log(`Express server listening on port: ${SERVER_CONFIG.port}`)
            done()
        })
    })

    after((done: any) => {
        server.close()
        done()
    })

    it('should corrently handle a service client request', async () => {
        return client.add(5, 7)
            .then((response: number) => {
                expect(response).to.equal(12)
            })
    })

    it('should corrently handle a service client request for a struct', async () => {
        return client.getStruct(1)
            .then((response: SharedStruct) => {
                const expected = new SharedStruct({
                    key: 0,
                    value: 'test',
                })
                expect(response).to.equal(expected)
            })
    })

    it('should correctly handle a service request with context', async () => {
        return client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'fake-token' } })
            .then((response: number) => {
                expect(response).to.equal(12)
            })
    })

    it('should reject service call with incorrect context', async () => {
        return client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'wrong' } })
            .then((response: number) => {
                throw new Error('Should reject for incorrect context')
            }, (err: any) => {
                expect(err.message).to.equal('Unauthorized')
            })
    })

    it('should handle requests not pointed to thrift service', (done: any) => {
        exec(`curl http://${SERVER_CONFIG.hostName}:${SERVER_CONFIG.port}/control`, (err, stout, sterr) => {
            expect(stout).to.equal('PASS')
            done()
        })
    })
})
