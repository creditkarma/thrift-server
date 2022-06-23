import {
    ITraceId,
    randomTraceId,
    serializeLinkerdHeader,
    traceIdFromTraceId,
} from '@creditkarma/zipkin-core'

import { expect } from '@hapi/code'
import * as Hapi from '@hapi/hapi'
import * as Lab from '@hapi/lab'
import got from 'got'
import * as net from 'net'

import { CLIENT_CONFIG } from '../../config'

import { createServer as addService } from '../../hapi-add-service'
import { createServer as calculatorService } from '../../hapi-calculator-service'
import { createServer as mockCollector, IMockCollector } from './mock-collector'

import { createClientServer } from '../client'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('Tracing', () => {
    let calcServer: Hapi.Server
    let addServer: Hapi.Server
    let clientServer: net.Server
    let collectServer: IMockCollector

    before(async () => {
        process.env.ZIPKIN_ENDPOINT = 'http://localhost:9411/api/v2/spans'
        process.env.ZIPKIN_VERSION = 'v2'
        calcServer = await calculatorService(1)
        addServer = await addService(1)
        clientServer = await createClientServer(1)
        collectServer = await mockCollector()
        return Promise.all([calcServer.start(), addServer.start()]).then(
            (err) => {
                console.log('Thrift server running')
            },
        )
    })

    after(async () => {
        return new Promise<void>((resolve, reject) => {
            clientServer.close(() => {
                clientServer.unref()
                collectServer.close().then(() => {
                    Promise.all([calcServer.stop(), addServer.stop()]).then(
                        (err) => {
                            console.log('Thrift server stopped')
                            resolve()
                        },
                    )
                })
            })
        })
    })

    it('should correctly trace request using B3 headers', async () => {
        return new Promise<void>((resolve, reject) => {
            collectServer.reset()
            const traceId_1: string = '4808dde1609f5673'
            const traceId_2: string = 'b82ba1422cf1ec6c'
            Promise.all([
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 5,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'x-b3-traceid': traceId_1,
                            'x-b3-spanid': traceId_1,
                            'x-b3-parentspanid': traceId_1,
                            'x-b3-sampled': '1',
                        },
                    },
                ),
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 8,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'x-b3-traceid': traceId_2,
                            'x-b3-spanid': traceId_2,
                            'x-b3-parentspanid': traceId_2,
                            'x-b3-sampled': '1',
                        },
                    },
                ),
            ]).then(
                (val) => {
                    expect([val[0].body, val[1].body]).to.equal([
                        'result: 14',
                        'result: 17',
                    ])
                    setTimeout(() => {
                        const result = collectServer.traces()
                        expect(result[traceId_1]).to.exist()
                        expect(result[traceId_2]).to.exist()
                        resolve()
                    }, 3000)
                },
                (err: any) => {
                    console.log('err: ', err)
                    reject(err)
                },
            )
        })
    })

    it('should allow clients to pass zipkin context to plugin', async () => {
        return new Promise<void>((resolve, reject) => {
            const traceId_1: string = randomTraceId()
            Promise.all([
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate-overwrite`,
                    {
                        searchParams: {
                            left: 5,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'x-b3-traceid': traceId_1,
                            'x-b3-spanid': traceId_1,
                            'x-b3-parentspanid': traceId_1,
                            'x-b3-sampled': 'true',
                        },
                    },
                ),
            ]).then(
                (val) => {
                    expect(val[0].body).to.equal('result: 14')
                    setTimeout(() => {
                        const result = collectServer.traces()
                        expect(result[traceId_1]).to.exist()
                        expect(result['411d1802c9151ded']).to.exist()
                        resolve()
                    }, 3000)
                },
                (err: any) => {
                    console.log('err: ', err)
                    reject(err)
                },
            )
        })
    })

    it('should correctly trace request using L5D headers', async () => {
        return new Promise<void>((resolve, reject) => {
            const traceId_1: string = randomTraceId()
            const traceId_2: string = randomTraceId()
            Promise.all([
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 5,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'l5d-ctx-trace': serializeLinkerdHeader(
                                traceIdFromTraceId({
                                    traceId: traceId_1,
                                    spanId: traceId_1,
                                    parentId: traceId_1,
                                    sampled: true,
                                }),
                            ),
                        },
                    },
                ),
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 7,
                            op: 'add',
                            right: 22,
                        },
                        headers: {
                            'l5d-ctx-trace': serializeLinkerdHeader(
                                traceIdFromTraceId({
                                    traceId: traceId_2,
                                    spanId: traceId_2,
                                    parentId: traceId_2,
                                    sampled: true,
                                }),
                            ),
                        },
                    },
                ),
            ]).then(
                (val) => {
                    expect([val[0].body, val[1].body]).to.equal([
                        'result: 14',
                        'result: 29',
                    ])
                    setTimeout(() => {
                        const result = collectServer.traces()
                        expect(result[traceId_1]).to.exist()
                        expect(result[traceId_2]).to.exist()
                        resolve()
                    }, 3000)
                },
                (err: any) => {
                    console.log('err: ', err)
                    reject(err)
                },
            )
        })
    })

    it('should use B3 headers if traceIds do not match', async () => {
        return new Promise<void>((resolve, reject) => {
            const traceId_1: string = randomTraceId()
            const traceId_2: string = randomTraceId()
            Promise.all([
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 5,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'l5d-ctx-trace': serializeLinkerdHeader(
                                traceIdFromTraceId({
                                    traceId: traceId_1,
                                    spanId: traceId_1,
                                    parentId: traceId_1,
                                    sampled: true,
                                }),
                            ),
                            'x-b3-traceid': traceId_2,
                            'x-b3-spanid': traceId_2,
                            'x-b3-parentspanid': traceId_2,
                            'x-b3-sampled': '1',
                        },
                    },
                ),
            ]).then(
                (val) => {
                    expect(val[0].body).to.equal('result: 14')
                    setTimeout(() => {
                        const result = collectServer.traces()
                        expect(Object.keys(result)[0]).to.equal(traceId_2)
                        expect(Object.keys(result[traceId_2]).length).to.equal(
                            3,
                        )
                        resolve()
                    }, 3000)
                },
                (err: any) => {
                    console.log('err: ', err)
                    reject(err)
                },
            )
        })
    })

    it('should use L5D headers if traceIds do match', async () => {
        return new Promise<void>((resolve, reject) => {
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
                got(
                    `http://${CLIENT_CONFIG.hostName}:${CLIENT_CONFIG.port}/calculate`,
                    {
                        searchParams: {
                            left: 5,
                            op: 'add',
                            right: 9,
                        },
                        headers: {
                            'l5d-ctx-trace': serializeLinkerdHeader(
                                traceIdFromTraceId(trace_1),
                            ),
                            'x-b3-traceid': trace_2.traceId,
                            'x-b3-spanid': trace_2.spanId,
                            'x-b3-parentspanid': trace_2.parentId,
                            'x-b3-sampled': 'true',
                        },
                    },
                ),
            ]).then(
                (val) => {
                    expect(val[0].body).to.equal('result: 14')
                    setTimeout(() => {
                        const result = collectServer.traces()
                        const piece = result[trace_1.traceId][trace_1.spanId]
                        expect(piece.traceId).to.equal(trace_1.traceId)
                        expect(piece.id).to.equal(trace_1.spanId)
                        expect(piece.parentId).to.equal(trace_1.parentId)
                        resolve()
                    }, 3000)
                },
                (err: any) => {
                    console.log('err: ', err)
                    reject(err)
                },
            )
        })
    })
})
