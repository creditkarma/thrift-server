import { exec } from 'child_process'
import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'

import {
  CLIENT_CONFIG,
} from './config'

import {
    createServer,
} from './server'

import {
    createClientServer,
} from './client'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Thrift Integration', () => {
    let appServer: Hapi.Server
    let clientServer: net.Server

    before(async () => {
        appServer = createServer()
        clientServer = await createClientServer()

        return appServer.start().then((err) => {
            console.log('Thrift server running')
        })
    })

    after(async () => {
        clientServer.close()
        return appServer.stop().then(() => {
            console.log('Thrift server stopped')
        })
    })

    it('should handle requests not pointed to thrift service', (done: any) => {
        exec(`curl -G http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate --data-urlencode "left=5" --data-urlencode "op=add" --data-urlencode "right=9"`, (err, stout, sterr) => {
            expect(stout).to.equal('result: 14')
            done()
        })
    })
})
