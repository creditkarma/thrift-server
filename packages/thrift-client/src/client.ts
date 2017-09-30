import {
  TTransport,
  TProtocol,
  TBinaryProtocol,
  TBufferedTransport,
  TMessage,
  Thrift,
} from 'thrift'

const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

import {
  HttpConnection
} from './connection'

const noop = (): void => {}

export function createClient<TClient>(
  ServiceClient: { new (output: TTransport, pClass: { new (trans: TTransport): TProtocol }): TClient; },
  connection: HttpConnection
): TClient {
  const transport: TTransport = new TBufferedTransport(undefined, (data: Buffer, seqid: number): void => {
    const clientCallback = (<any>client)._reqs[seqid];
    connection.write(data, seqid).then((returnValue: Buffer) => {
      const reader: TTransport = new TBufferedTransport(undefined, noop);
      const proto: TProtocol = new TBinaryProtocol(reader);
      let isAtEnd: boolean = false;

      if ((<any>reader).writeCursor + returnValue.length > (<any>reader).inBuf.length) {
        const buf: Buffer = new Buffer((<any>reader).writeCursor + data.length);
        (<any>reader).inBuf.copy(buf, 0, 0, (<any>reader).writeCursor);
        (<any>reader).inBuf = buf;
      }
      returnValue.copy((<any>reader).inBuf, (<any>reader).writeCursor, 0);
      (<any>reader).writeCursor += returnValue.length;

      try {
        while (!isAtEnd) {
          const header: TMessage = proto.readMessageBegin();
          const dummy_seqid: number = (header.rseqid * -1);

          (<any>client)._reqs[dummy_seqid] = (err: any, success: any) => {
            reader.commitPosition();
            delete (<any>client)._reqs[header.rseqid];
            if (clientCallback) {
              process.nextTick(() => {
                clientCallback(err, success);
              });
            }
          };

          if ((<any>client)['recv_' + header.fname]) {
            (<any>client)['recv_' + header.fname](proto, header.mtype, dummy_seqid);
          } else {
            delete (<any>client)._reqs[dummy_seqid];
            process.nextTick(() => {
              clientCallback(new Thrift.TApplicationException(
                Thrift.TApplicationExceptionType.WRONG_METHOD_NAME,
                "Received a response to an unknown RPC function"
              ), undefined);
            });
          }
        }
      }
      catch (err) {
        if (err instanceof InputBufferUnderrunError) {
          reader.rollbackPosition();
        } else {
          isAtEnd = true;
          process.nextTick(() => {
            clientCallback(err, undefined);
          });
        }
      }
    }, (err: any) => {
      process.nextTick(() => {
        clientCallback(err, undefined);
      });
    });
  });
  const client: TClient = new ServiceClient(transport, TBinaryProtocol)

  return client;
}