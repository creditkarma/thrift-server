import TBufferedTransport = require('thrift/lib/nodejs/lib/thrift/buffered_transport')
import TJSONProtocol = require('thrift/lib/nodejs/lib/thrift/json_protocol')
import InputBufferUnderrunError = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

function handleBody(processor, buffer) {
  const transportWithData = new TBufferedTransport()
  transportWithData.inBuf = buffer
  transportWithData.writeCursor = buffer.length
  const input = new TJSONProtocol(transportWithData)

  return new Promise((resolve, reject) => {
    const output = new TJSONProtocol(new TBufferedTransport(undefined, resolve))

    try {
      processor.process(input, output)
      transportWithData.commitPosition()
      resolve()
    } catch (err) {
      if (err instanceof InputBufferUnderrunError) {
        transportWithData.rollbackPosition()
      } else {
        reject(err)
      }
    }
  })
}

export function thriftExpress(Service, handlers) {

  async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(403).send('Method must be POST')
    }

    try {
      const result = await handleBody(new Service(handlers), req.body)
      res.status(200).end(result)
    } catch (err) {
      console.log(err)
    }
  }

  return handler
}
