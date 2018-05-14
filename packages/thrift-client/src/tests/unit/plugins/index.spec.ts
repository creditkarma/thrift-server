import { expect } from 'code'
import * as Lab from 'lab'

import {
    BinaryProtocol,
    BufferedTransport,
    MessageType,
    TProtocol,
    TTransport,
} from '@creditkarma/thrift-server-core'

import {
    appendThriftObject,
    readThriftObject,
} from '../../../main/plugins'

import { encode } from '../../../main/plugins/appendThriftObject'

import {
    Metadata,
} from '../../generated/common/common'

import {
    Calculator,
} from '../../generated/calculator/calculator'

import {
    SharedStruct,
} from '../../generated/shared/shared'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Plugins', () => {
    describe('appendThriftObject', () => {
        it('should append thrift object to head of byte array', async () => {
            const meta: Metadata = new Metadata({ traceId: 6 })
            const writer: TTransport = new BufferedTransport()
            const output: TProtocol = new BinaryProtocol(writer)
            output.writeMessageBegin('ping', MessageType.CALL, 1)
            const args: Calculator.PingArgs = new Calculator.PingArgs({})
            args.write(output)
            output.writeMessageEnd()
            const data: Buffer = writer.flush()
            const totalLength: number = (await encode(meta)).length + data.length
            return appendThriftObject(meta, data).then((val: Buffer) => {
                expect(val.length).to.equal(totalLength)
                return readThriftObject(val, Metadata).then((result: [Metadata, Buffer]) => {
                    expect(result[1].length).to.equal(data.length)
                })
            })
        })
    })

    describe('readThriftObject', () => {
        it('should reject when unable to read thrift object from Buffer', async () => {
            const meta: Metadata = new Metadata({ traceId: 7 })
            const data: Buffer = Buffer.from([1, 2, 3, 4, 5])
            const totalLength: number = (await encode(meta)).length + data.length
            return appendThriftObject(meta, data).then((val: Buffer) => {
                expect(val.length).to.equal(totalLength)
                return readThriftObject(val, SharedStruct).then((result: [SharedStruct, Buffer]) => {
                    throw new Error('Should reject')
                }, (err: any) => {
                    expect(err.message).to.equal('Unable to read SharedStruct from input')
                })
            })
        })
    })
})
