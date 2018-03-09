import {
    randomTraceId,
    serializeLinkerdHeader,
    traceIdFromTraceId,
    ITraceId,
} from '@creditkarma/thrift-server-core'
import { expect } from 'code'
import * as Hapi from 'hapi'
import * as Lab from 'lab'
import * as net from 'net'
import * as rp from 'request-promise-native'

import {
    CLIENT_CONFIG,
} from '../config'

import { createServer as addService } from '../add-service'
import { createServer as calculatorService } from '../calculator-service'
import { createServer as mockCollector } from './mock-collector'

import {
    createClientServer,
} from '../client'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Observability', () => {
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

    it('should correctly trace request using B3 headers', (done: any) => {
        const traceId_1: string = randomTraceId()
        const traceId_2: string = randomTraceId()
        Promise.all([
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },
                headers: {
                    'x-b3-traceid': traceId_1,
                    'x-b3-spanid': traceId_1,
                    'x-b3-parentspanid': traceId_1,
                    'x-b3-sampled': true,
                },
            }),
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 7,
                    op: 'add',
                    right: 22,
                },
                headers: {
                    'x-b3-traceid': traceId_2,
                    'x-b3-spanid': traceId_2,
                    'x-b3-parentspanid': traceId_2,
                    'x-b3-sampled': true,
                },
            }),
        ]).then((val: any) => {
            expect(val).to.equal(['result: 14', 'result: 29'])
            setTimeout(() => {
                rp('http://localhost:9411/api/v1/spans').then((traces: any) => {
                    const result = JSON.parse(traces)
                    expect(Object.keys(result).length).to.equal(2)
                    expect(result[traceId_1]).to.exist()
                    expect(result[traceId_2]).to.exist()
                    expect(Object.keys(result[traceId_1]).length).to.equal(3)
                    expect(Object.keys(result[traceId_2]).length).to.equal(3)
                    done()
                })
            }, 3000)
        })
    })

    it('should correctly trace request using L5D headers', (done: any) => {
        const traceId_1: string = randomTraceId()
        const traceId_2: string = randomTraceId()
        Promise.all([
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },
                headers: {
                    'l5d-ctx-trace': serializeLinkerdHeader(traceIdFromTraceId({
                        traceId: traceId_1,
                        spanId: traceId_1,
                        parentId: traceId_1,
                        sampled: true,
                    })),
                },
            }),
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 7,
                    op: 'add',
                    right: 22,
                },
                headers: {
                    'l5d-ctx-trace': serializeLinkerdHeader(traceIdFromTraceId({
                        traceId: traceId_2,
                        spanId: traceId_2,
                        parentId: traceId_2,
                        sampled: true,
                    })),
                },
            }),
        ]).then((val: any) => {
            expect(val).to.equal(['result: 14', 'result: 29'])
            setTimeout(() => {
                rp('http://localhost:9411/api/v1/spans').then((traces: any) => {
                    const result = JSON.parse(traces)
                    expect(Object.keys(result).length).to.equal(2)
                    expect(result[traceId_1]).to.exist()
                    expect(result[traceId_2]).to.exist()
                    expect(Object.keys(result[traceId_1]).length).to.equal(3)
                    expect(Object.keys(result[traceId_2]).length).to.equal(3)
                    done()
                })
            }, 3000)
        })
    })

    it('should use B3 headers if traceIds do not match', (done: any) => {
        const traceId_1: string = randomTraceId()
        const traceId_2: string = randomTraceId()
        Promise.all([
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },
                headers: {
                    'l5d-ctx-trace': serializeLinkerdHeader(traceIdFromTraceId({
                        traceId: traceId_1,
                        spanId: traceId_1,
                        parentId: traceId_1,
                        sampled: true,
                    })),
                    'x-b3-traceid': traceId_2,
                    'x-b3-spanid': traceId_2,
                    'x-b3-parentspanid': traceId_2,
                    'x-b3-sampled': true,
                },
            }),
        ]).then((val: any) => {
            expect(val).to.equal(['result: 14'])
            setTimeout(() => {
                rp('http://localhost:9411/api/v1/spans').then((traces: any) => {
                    const result = JSON.parse(traces)
                    expect(Object.keys(result).length).to.equal(1)
                    expect(Object.keys(result)[0]).to.equal(traceId_2)
                    expect(Object.keys(result[traceId_2]).length).to.equal(3)
                    done()
                })
            }, 3000)
        })
    })

    it('should use L5D headers if traceIds do match', (done: any) => {
        const traceId_1: string = randomTraceId()
        const trace_1: ITraceId = {
            traceId: traceId_1,
            spanId: randomTraceId(),
            parentId: randomTraceId(),
            sampled: true,
        }
        const trace_2: ITraceId = {
            traceId: traceId_1,
            spanId: randomTraceId(),
            parentId: randomTraceId(),
            sampled: true,
        }
        Promise.all([
            rp(`http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`, {
                qs: {
                    left: 5,
                    op: 'add',
                    right: 9,
                },
                headers: {
                    'l5d-ctx-trace': serializeLinkerdHeader(
                        traceIdFromTraceId(trace_1)
                    ),
                    'x-b3-traceid': trace_2.traceId,
                    'x-b3-spanid': trace_2.spanId,
                    'x-b3-parentspanid': trace_2.parentId,
                    'x-b3-sampled': true,
                },
            }),
        ]).then((val: any) => {
            expect(val).to.equal(['result: 14'])
            setTimeout(() => {
                rp('http://localhost:9411/api/v1/spans').then((traces: any) => {
                    const result = JSON.parse(traces)
                    const piece = result[trace_1.traceId][trace_1.spanId]
                    expect(Object.keys(result).length).to.equal(1)
                    expect(piece.traceId).to.equal(trace_1.traceId)
                    expect(piece.id).to.equal(trace_1.spanId)
                    expect(piece.parentId).to.equal(trace_1.parentId)
                    done()
                })
            }, 3000)
        })
    })
})
