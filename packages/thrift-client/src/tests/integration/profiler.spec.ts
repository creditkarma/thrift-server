import { AsyncScope } from '@creditkarma/async-scope'
import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'
import * as rp from 'request-promise-native'

import { createServer as addService } from './add-service'
import { createServer as calculatorService } from './calculator-service'
import { createServer as mockCollector } from './tracing/mock-collector'

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

// Aprox delay between requests
const REQUEST_DELAY: number = 20

// Max heap size in MB
const MAX_HEAP_SIZE: number = 200

// Track heap usage
let totalHeapSize: number = 0
let heapCount: number = 0
let maxHeapSize: number = 0
let minHeapSize: number = 10000

// Track response times
let totalDuration: number = 0
let durationCount: number = 0
let maxResponseTime: number = 0
let minResponseTime: number = 10000

const checkMemory = () => {
    const used: number = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)
    totalHeapSize += used
    heapCount += 1

    if (used < minHeapSize) {
        minHeapSize = used
    }

    if (used > maxHeapSize) {
        maxHeapSize = used
    }

    if (process.env.DEBUG) {
        AsyncScope.debug(`Used: ${used} MB`)
    }

    if (used > MAX_HEAP_SIZE) {
        throw new Error(`Heap usage[${Math.round(used)}] exceeded ${MAX_HEAP_SIZE} MB`)
    }
}

const profile = (totalTestTime: number) => {
    checkMemory()

    const averageResponseTime: number = totalDuration / durationCount
    const averageHeapSize: number = totalHeapSize / heapCount

    console.log(`
    -------------------------------------------------------------------
    Number of requests: ${REQUEST_COUNT}
    Total test time: ${totalTestTime} ms
    -------------------------------------------------------------------
    Average response time: ${averageResponseTime} ms
    Max response time: ${maxResponseTime} ms
    Min response time: ${minResponseTime} ms
    -------------------------------------------------------------------
    Average heap size: ${averageHeapSize} MB
    Max heap size: ${maxHeapSize} MB
    Min heap size: ${minHeapSize} MB
    -------------------------------------------------------------------
    `)
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
        let isFinished: boolean = false

        const testStartTime: number = Date.now()

        const runRequest = (): void => {
            const startTime: number = Date.now()
            current += 1

            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },

            }).then(() => {
                checkMemory()
                const completedTime: number = Date.now()
                const duration: number = (completedTime - startTime)
                totalDuration += duration
                durationCount += 1

                if (duration < minResponseTime) {
                    minResponseTime = duration
                }

                if (duration > maxResponseTime) {
                    maxResponseTime = duration
                }

                completed += 1
                if (completed === REQUEST_COUNT) {
                    profile(completedTime - testStartTime)
                    expect(true).to.equal(true)
                    isFinished = true
                    done()
                }

            }, (err: any) => {
                isFinished = true
                done(err)
            })

            setTimeout(() => {
                if (current < REQUEST_COUNT && !isFinished) {
                    runRequest()
                }
            }, (Math.random() * REQUEST_DELAY))
        }

        runRequest()
    })
})
