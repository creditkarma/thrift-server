import {
  MessageType,
  TApplicationException,
  TApplicationExceptionType,
  Type,
} from 'thrift'

import * as Q from 'q'

class Processor {
  private handlers: any
  private namespace: any

  constructor(namespace, handlers) {
    this.namespace = namespace
    // TODO: default handlers or error?
    this.handlers = handlers
  }

  public process(input, output) {
    const { fname, seqid, rseqid } = input.readMessageBegin()
    const handler = this.handlers[fname]
    // TODO: Needs to be generated and exposed on `namespace`
    const Args = this.namespace[`${fname}_args`]
    // TODO: Needs to be generated and exposed on `namespace`
    const Result = this.namespace[`${fname}_result`]
    // TODO: Needs to be generated and exposed on `namespace`
    const Err = this.namespace[`${fname}_error`]
    if (typeof handler === 'function') {
      const args = new Args()
      args.read(input)
      input.readMessageEnd()
      Q.fcall(handler, args)
        .then((result) => {
          // This handles `oneway`
          if (!Result) {
            return
          }
          const resultObj = new Result({success: result})
          output.writeMessageBegin(fname, MessageType.REPLY, seqid)
          resultObj.write(output)
          output.writeMessageEnd()
          output.flush()
        }, (err) => {
          // TODO: How does `oneway` handle `throws`?
          if (!Err) {
            return
          }
          const result = new Err(err)
          let type
          if (result.unknown) {
            type = MessageType.EXCEPTION
          } else {
            type = MessageType.REPLY
          }
          output.writeMessageBegin(fname, type, seqid)
          result.write(output)
          output.writeMessageEnd()
          output.flush()
        })
    }

    input.skip(Type.STRUCT)
    input.readMessageEnd()
    const x = new TApplicationException(TApplicationExceptionType.UNKNOWN_METHOD, 'Unknown function ' + fname)
    output.writeMessageBegin(fname, MessageType.EXCEPTION, rseqid)
    x.write(output)
    output.writeMessageEnd()
    output.flush()
  }
}
