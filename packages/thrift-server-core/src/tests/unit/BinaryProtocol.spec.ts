import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'

import {
    BinaryProtocol,
    // Int64,
    // JSONProtocol,
    // MessageType,
    // TType,
    BufferedTransport,
} from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('BinaryProtocol', () => {
    describe('writeI64', () => {
        it('should read and write bigints', () => {
            const transport = new BufferedTransport()
            const protocol = new BinaryProtocol(transport)

            protocol.writeI64(12n)

            const readTransport = new BufferedTransport(protocol.flush())
            const readProtocol = new BinaryProtocol(readTransport)

            expect(readProtocol.readI64()).to.equal(12n)
        })

        it('should read and write numbers', () => {
            const transport = new BufferedTransport()
            const protocol = new BinaryProtocol(transport)

            protocol.writeI64(12)

            const readTransport = new BufferedTransport(protocol.flush())
            const readProtocol = new BinaryProtocol(readTransport)

            expect(readProtocol.readI64()).to.equal(12n)
        })
    })
})
