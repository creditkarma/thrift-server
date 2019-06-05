import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'

import {
    appendThriftObject,
    BinaryProtocol,
    BufferedTransport,
    encode,
    MessageType,
    readThriftObject,
    TProtocol,
    TTransport,
} from '../../main'

import * as Utils from '../../main/utils'

import { IMetadata, MetadataCodec } from '../generated/common'

import { ISharedStruct, SharedStructCodec } from '../generated/shared'

import { Calculator } from '../generated/calculator-service'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
    describe('appendThriftObject', () => {
        it('should append thrift object to head of byte array', async () => {
            const meta: IMetadata = { traceId: 6 }
            const writer: TTransport = new BufferedTransport()
            const output: TProtocol = new BinaryProtocol(writer)
            output.writeMessageBegin('ping', MessageType.CALL, 1)
            const args: Calculator.IPing__Args = {}
            Calculator.Ping__ArgsCodec.encode(args, output)
            output.writeMessageEnd()
            const data: Buffer = writer.flush()
            const totalLength: number =
                (await encode(meta, MetadataCodec)).length + data.length

            return appendThriftObject(meta, data, MetadataCodec).then(
                (val: Buffer) => {
                    expect(val.length).to.equal(totalLength)

                    return readThriftObject<IMetadata>(val, MetadataCodec).then(
                        (result: [IMetadata, Buffer]) => {
                            expect(result[1].length).to.equal(data.length)
                        },
                    )
                },
            )
        })
    })

    describe('readThriftObject', () => {
        it('should reject when unable to read thrift object from Buffer', async () => {
            const meta: IMetadata = { traceId: 7 }
            const data: Buffer = Buffer.from([1, 2, 3, 4, 5])
            const totalLength: number =
                (await encode(meta, MetadataCodec)).length + data.length

            return appendThriftObject(meta, data, MetadataCodec).then(
                (val: Buffer) => {
                    expect(val.length).to.equal(totalLength)

                    return readThriftObject<ISharedStruct>(
                        val,
                        SharedStructCodec,
                    ).then(
                        (result: [ISharedStruct, Buffer]) => {
                            throw new Error('Should reject')
                        },
                        (err: any) => {
                            expect(err.message).to.equal(
                                'Unable to read SharedStruct from input',
                            )
                        },
                    )
                },
            )
        })
    })

    describe('deepMerge', () => {
        it('should merge two objects into new object', async () => {
            const obj1: any = {
                name: {
                    first: 'Bob',
                    last: 'Smith',
                },
            }
            const obj2: any = {
                name: {
                    last: 'Murphy',
                },
                email: 'bob@fake.com',
            }
            const actual = Utils.deepMerge(obj1, obj2)
            const expected: any = {
                name: {
                    first: 'Bob',
                    last: 'Murphy',
                },
                email: 'bob@fake.com',
            }

            expect(actual).to.equal(expected)
            expect(obj1).to.equal({
                name: {
                    first: 'Bob',
                    last: 'Smith',
                },
            })
        })
    })

    describe('normalizePath', () => {
        it('should add leading slash to path', async () => {
            const path: string = 'thrift'
            const actual: string = Utils.normalizePath(path)
            const expected: string = '/thrift'

            expect(actual).to.equal(expected)
        })

        it('should remove trailing slash from path', async () => {
            const path: string = '/thrift/'
            const actual: string = Utils.normalizePath(path)
            const expected: string = '/thrift'

            expect(actual).to.equal(expected)
        })

        it('should add leading slash and remove trailing slash from path', async () => {
            const path: string = 'thrift/'
            const actual: string = Utils.normalizePath(path)
            const expected: string = '/thrift'

            expect(actual).to.equal(expected)
        })

        it('should leave path unchanged with leading slash and without trailing slash', async () => {
            const path: string = '/thrift/my-service'
            const actual: string = Utils.normalizePath(path)
            const expected: string = '/thrift/my-service'

            expect(actual).to.equal(expected)
        })

        it('should return empty string for empty path', async () => {
            const path: string = '/'
            const actual: string = Utils.normalizePath(path)
            const expected: string = ''

            expect(actual).to.equal(expected)
        })

        it('should return empty string for empty string', async () => {
            const path: string = ''
            const actual: string = Utils.normalizePath(path)
            const expected: string = ''

            expect(actual).to.equal(expected)
        })
    })
})
