import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'
import * as rp from 'request-promise-native'

import {
    CLIENT_CONFIG,
} from './config'

import { createServer as addService } from './add-service'
import { createServer as calculatorService } from './calculator-service'
import { createServer as mockCollector } from './observability/mock-collector'

import {
    createClientServer,
} from './client'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

const sizes: Array<number> = [ 100 ]

const average = () => {
    const sum = sizes.reduce((a, b) => a + b)
    return (sum / sizes.length)
}

const profile = () => {
    const rss = process.memoryUsage().rss / 1024 / 1024
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    const total = process.memoryUsage().heapTotal / 1024 / 1024

    if (process.env.DEBUG) {
        console.log(`RSS: ${rss} MB`)
        console.log(`Used: ${used} MB`)
        console.log(`Total: ${total} MB`)
    }

    if (used > (average() * 1.30)) {
        throw new Error(`Heap usage spike`)
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
        const count: number = 1000
        let current: number = 0
        let completed: number = 0

        function runRequest(): void {
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
                if (completed === count) {
                    profile()
                    expect(true).to.equal(true)
                    done()
                }
            })

            setTimeout(() => {
                if (current < count) {
                    runRequest()
                }
            }, (Math.random() * 20 + 5))
        }

        runRequest()
    })
})
