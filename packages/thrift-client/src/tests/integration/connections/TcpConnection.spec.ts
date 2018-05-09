import { readThriftMethod } from '@creditkarma/thrift-server-core'
import * as net from 'net'

import {
    IRequestResponse,
    NextFunction,
    RequestInstance,
    TcpConnection,
    ThriftContext,
} from '../../../main'

import * as request from 'request'
import { CoreOptions } from 'request'

import { CALC_SERVER_CONFIG } from '../config'

import { expect } from 'code'
import * as Lab from 'lab'

import { createServer } from '../apache-service'

import { Calculator } from '../generated/calculator/calculator'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('TcpConnection', () => {
    let server: net.Server

    before((done) => {
        server = createServer()
        server.listen(8888, 'localhost', () => {
            done()
        })
    })

    after((done) => {
        server.close(() => {
            done()
        })
    })

    it('should do things', async () => {

    })
})
