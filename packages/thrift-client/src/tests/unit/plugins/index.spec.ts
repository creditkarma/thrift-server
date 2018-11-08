import { expect } from 'code'
import * as Lab from 'lab'

import {
    BinaryProtocol,
    BufferedTransport,
    MessageType,
    TProtocol,
    TTransport,
} from '@creditkarma/thrift-server-core'

import { appendThriftObject, readThriftObject } from '../../../main/plugins'

import { encode } from '../../../main/plugins/appendThriftObject'

import { IMetadata, MetadataCodec } from '../../generated/common'

import { Calculator } from '../../generated/calculator-service'

import { ISharedStruct, SharedStructCodec } from '../../generated/shared'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Plugins', () => {
    describe('appendThriftObject', () => {
        it('should append thrift object to head of byte array', async () => {
            const meta: IMetadata = { traceId: 6 }
            const writer: TTransport = new BufferedTransport()
            const output: TProtocol = new BinaryProtocol(writer)
            output.writeMessageBegin('ping', MessageType.CALL, 1)
            const args: Calculator.IPingArgs = {}
            Calculator.PingArgsCodec.encode(args, output)
            output.writeMessageEnd()
            const data: Buffer = writer.flush()
            const totalLength: number =
                (await encode(meta, MetadataCodec)).length + data.length

            return appendThriftObject(meta, data, MetadataCodec).then(
                (val: Buffer) => {
                    expect(val.length).to.equal(totalLength)

                    return readThriftObject(val, MetadataCodec).then(
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

                    return readThriftObject(val, SharedStructCodec).then(
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
})
