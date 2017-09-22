import {
  getProtocol,
  getService,
  getTransport,
  isProtocolSupported,
  isTransportSupported,
  process,
  supportedProtocols,
  supportedTransports,
} from 'thrift-server-core'

// TODO: Can these be typed to specific strings?
export interface IOptions {
  transport?: string
  protocol?: string
}

// TODO: Is there a cleaner way to type + default options?
export function thriftExpress(Service, handlers, options: IOptions = {} as any) {

  const transport = options.transport
  if (transport && !isTransportSupported(transport)) {
    throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
  }
  // TODO: Is this okay to look up once per plugin?
  const Transport = getTransport(transport)

  const protocol = options.protocol
  if (protocol && !isProtocolSupported(protocol)) {
    throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
  }
  // TODO: Is this okay to look up once per plugin?
  const Protocol = getProtocol(protocol)

  // TODO: Should this be constructed once per plugin or once per request?
  const service = getService(Service, handlers)

  async function handler(req, res, next) {
    if (req.method !== 'POST') {
      return res.status(403).send('Method must be POST')
    }

    try {
      const result = await process(service, req, Transport, Protocol)
      res.status(200).end(result)
    } catch (err) {
      next(err)
    }
  }

  return handler
}
