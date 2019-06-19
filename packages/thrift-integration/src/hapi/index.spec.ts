import { createHttpClient } from '@creditkarma/thrift-client'

import { Int64, TApplicationException } from '@creditkarma/thrift-server-core'

import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import { CoreOptions } from 'request'
import * as rp from 'request-promise-native'

import { HAPI_CALC_SERVER_CONFIG } from '../config'

import { Calculator } from '../generated/calculator-service'

import { ISharedStruct } from '../generated/shared'

import { createServer as createCalcServer } from '../hapi-calculator-service'

import { createServer as createAddServer } from '../hapi-add-service'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Server Hapi', () => {
    let calcServer: Hapi.Server
    let addServer: Hapi.Server
    let client: Calculator.Client<CoreOptions>

    before(async () => {
        calcServer = await createCalcServer()
        addServer = await createAddServer()
        client = createHttpClient(Calculator.Client, HAPI_CALC_SERVER_CONFIG)

        return Promise.all([calcServer.start(), addServer.start()]).then(() => {
            console.log('Thrift server started')
        })
    })

    after(async () => {
        return Promise.all([calcServer.stop(), addServer.stop()]).then(() => {
            console.log('Thrift server stopped')
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
                    throw new Error('Should reject with incorrect context')
                },
                (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                },
            )
    })

    it('should reject for service call that throws', async () => {
        return client.broken().then(
            (response: void) => {
                throw new Error('Should reject')
            },
            (err: any) => {
                expect(err).to.be.instanceOf(TApplicationException)
            },
        )
    })

    it('should handle requests not pointed to thrift service', async () => {
        return rp(
            `http://${HAPI_CALC_SERVER_CONFIG.hostName}:${HAPI_CALC_SERVER_CONFIG.port}/control`,
        ).then((val) => {
            expect(val).to.equal('PASS')
        })
    })
})
