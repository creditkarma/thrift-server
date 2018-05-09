import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'
import * as rp from 'request-promise-native'

import { createServer as addService } from './add-service'
import { createServer as calculatorService } from './calculator-service'
import { createServer as mockCollector } from './observability/mock-collector'

import {
    createClientServer,
} from './client'

import {
    CLIENT_CONFIG,
} from './config'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

// Number of requests to send
const REQUEST_COUNT: number = 1000

// Max heap size in MB
const MAX_HEAP_SIZE: number = 200

const profile = () => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024

    if (process.env.DEBUG) {
        console.log(`Used: ${used} MB`)
    }

    if (used > MAX_HEAP_SIZE) {
        throw new Error(`Heap usage[${Math.round(used)}] exceeded ${MAX_HEAP_SIZE} MB`)
    }
}

describe('Memory Profile', () => {
    let calcServer: Hapi.Server
    let addServer: Hapi.Server
    let clientServer: net.Server
    let collectServer: net.Server

    before(async () => {
        calcServer = calculatorService(1)
        addServer = addService(1)
        clientServer = await createClientServer(1)
        collectServer = await mockCollector()
        return Promise.all([
            calcServer.start(),
            addServer.start(),
        ]).then((err) => {
            console.log('Thrift server running')
        })
    })

    after(async () => {
        clientServer.close()
        collectServer.close()
        return Promise.all([
            calcServer.stop(),
            addServer.stop(),
        ]).then((err) => {
            console.log('Thrift server stopped')
        })
    })

    it('should verify consistent memory usage', (done: any) => {
        let current: number = 0
        let completed: number = 0

        const runRequest = (): void => {
            current += 1
            profile()

            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },
            }).then(() => {
                completed += 1
                if (completed === REQUEST_COUNT) {
                    profile()
                    expect(true).to.equal(true)
                    done()
                }
            }, (err: any) => {
                done(err)
            })

            setTimeout(() => {
                if (current < REQUEST_COUNT) {
                    runRequest()
                }
            }, (Math.random() * 20 + 5))
        }

        runRequest()
    })
})
