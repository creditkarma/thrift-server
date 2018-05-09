import { expect } from 'code'
import * as Lab from 'lab'
import * as rp from 'request-promise-native'

import * as childProcess from 'child_process'
import { CLIENT_CONFIG } from './config'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

const profile = () => {
    const rss = process.memoryUsage().rss / 1024 / 1024
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    const total = process.memoryUsage().heapTotal / 1024 / 1024

    if (process.env.DEBUG) {
        console.log(`RSS: ${rss} MB`)
        console.log(`Used: ${used} MB`)
        console.log(`Total: ${total} MB`)
    }

    if (used >= 150) {
        throw new Error(`Heap usage exceeded 150 MB`)
    }
}

describe('Memory Profile', () => {
    let server: childProcess.ChildProcess
    let client: childProcess.ChildProcess

    before((done: any) => {
        server = childProcess.fork('./dist/tests/server.js')
        client = childProcess.fork('./dist/tests/client.js')
        server.on('message', (msg: any) => console.log(msg))
        setTimeout(done, 2000)
    })

    after((done: any) => {
        server.kill('SIGINT')
        client.kill('SIGINT')
        setTimeout(done, 1000)
    })

    it('memory usage should be consistent', (done: any) => {
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
