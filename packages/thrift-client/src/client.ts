import {
  TBinaryProtocol,
  TBufferedTransport,
  TTransportConstructor,
  TProtocolConstructor,
  Thrift,
  TMessage,
  TProtocol,
  TTransport,
} from 'thrift'

const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

import {
  IHttpConnection,
} from './connections'

const noop = (): null => null

export function createClient<TClient>(
  ServiceClient: { new (output: TTransport, pClass: { new (trans: TTransport): TProtocol }): TClient; },
  connection: IHttpConnection,
): TClient {
  const transport: TTransport = new connection.transport(undefined, (data: Buffer, seqid: number): void => {
    const clientCallback = (client as any)._reqs[seqid]
    connection.write(data).then((returnValue: Buffer) => {
      const reader: TTransport = new connection.transport(undefined, noop)
      const proto: TProtocol = new connection.protocol(reader)

      // We need to ensure that we have enough room to write the incooming data
      if ((reader as any).writeCursor + returnValue.length > (reader as any).inBuf.length) {
        const buf: Buffer = new Buffer((reader as any).writeCursor + data.length);
        (reader as any).inBuf.copy(buf, 0, 0, (reader as any).writeCursor);
        (reader as any).inBuf = buf
      }
      returnValue.copy((reader as any).inBuf, (reader as any).writeCursor, 0);
      (reader as any).writeCursor += returnValue.length

      try {
        while (true) {
          const header: TMessage = proto.readMessageBegin()
          const dummyId: number = (header.rseqid * -1);

          (client as any)._reqs[dummyId] = (err: any, success: any) => {
            reader.commitPosition()
            delete (client as any)._reqs[header.rseqid]
            if (clientCallback) {
              process.nextTick(() => {
                clientCallback(err, success)
              })
            }
          }

          if ((client as any)['recv_' + header.fname]) {
            (client as any)['recv_' + header.fname](proto, header.mtype, dummyId)
          } else {
            delete (client as any)._reqs[dummyId]
            process.nextTick(() => {
              clientCallback(new Thrift.TApplicationException(
                Thrift.TApplicationExceptionType.WRONG_METHOD_NAME,
                `Received a response to an unknown RPC function: ${header.fname}`,
              ), undefined)
            })
          }
        }
      } catch (err) {
        if (err instanceof InputBufferUnderrunError) {
          reader.rollbackPosition()
        } else {
          process.nextTick(() => {
            clientCallback(err, undefined)
          })
        }
      }
    }, (err: any) => {
      process.nextTick(() => {
        clientCallback(err, undefined)
      })
    })
  })
  const client: TClient = new ServiceClient(transport, connection.protocol)

  return client
}
