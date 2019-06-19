import { expect } from 'code'
import * as express from 'express'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'
import { CoreOptions } from 'request'
import * as rp from 'request-promise-native'

import { createHttpClient } from '@creditkarma/thrift-client'

import { Int64 } from '@creditkarma/thrift-server-core'

import { EXPRESS_CALC_SERVER_CONFIG } from '../config'

import { Calculator } from '../generated/calculator-service'

import { ISharedStruct } from '../generated/shared'

import { createServer as createCalcServer } from '../express-calculator-service'

import { createServer as createAddServer } from '../hapi-add-service'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Server Express', () => {
    let calcServer: net.Server
    let addServer: Hapi.Server
    let client: Calculator.Client<CoreOptions>

    before(async () => {
        addServer = await createAddServer()

        return new Promise((resolve, reject) => {
            const app: express.Application = createCalcServer()
            client = createHttpClient(
                Calculator.Client,
                EXPRESS_CALC_SERVER_CONFIG,
            )

            calcServer = app.listen(EXPRESS_CALC_SERVER_CONFIG.port, () => {
                console.log(
                    `Express server listening on port: ${EXPRESS_CALC_SERVER_CONFIG.port}`,
                )
                addServer.start().then(() => resolve())
            })
        })
    })

    after(async () => {
        return new Promise((resolve, reject) => {
            calcServer.close(() => {
                addServer.stop().then(() => resolve())
            })
        })
    })

    it('should corrently handle a service client request', async () => {
        return client.add(5, 7).then((response: number) => {
            expect(response).to.equal(12)
        })
    })

    it('should corrently handle a service client request for a struct', async () => {
        return client.getStruct(1).then((response: ISharedStruct) => {
            const expected = {
                code: {
                    status: new Int64(0),
                },
                value: 'test',
            }
            expect(response).to.equal(expected)
        })
    })

    it('should correctly handle a service request with context', async () => {
        return client
            .addWithContext(5, 7, { headers: { 'x-fake-token': 'fake-token' } })
            .then((response: number) => {
                expect(response).to.equal(12)
            })
    })

    it('should reject service call with incorrect context', async () => {
        return client
            .addWithContext(5, 7, { headers: { 'x-fake-token': 'wrong' } })
            .then(
                (response: number) => {
                    throw new Error('Should reject for incorrect context')
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
    })

    it('should handle requests not pointed to thrift service', async () => {
        return rp(
            `http://${EXPRESS_CALC_SERVER_CONFIG.hostName}:${EXPRESS_CALC_SERVER_CONFIG.port}/control`,
        ).then((val) => {
            expect(val).to.equal('PASS')
        })
    })
})
