import {
  getProtocol,
  getService,
  getTransport,
  isProtocolSupported,
  isTransportSupported,
  process,
  supportedProtocols,
  supportedTransports,
} from '@creditkarma/thrift-server-core'

import {
  TProcessorConstructor,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

import * as express from 'express'

// TODO: Can these be typed to specific strings?
export interface IOptions {
  transport?: string
  protocol?: string
}

// TODO: Is there a cleaner way to type + default options?
export function thriftExpress<TProcessor, THandler>(
  Service: TProcessorConstructor<TProcessor, THandler>,
  handlers: THandler,
  options: IOptions = {}): express.RequestHandler {

  const transport = options.transport
  if (transport && !isTransportSupported(transport)) {
    throw new Error(`Invalid transport specified. Supported values: ${supportedTransports.join(', ')}`)
  }
  // TODO: Is this okay to look up once per plugin?
  const Transport: TTransportConstructor = getTransport(transport)

  const protocol = options.protocol
  if (protocol && !isProtocolSupported(protocol)) {
    throw new Error(`Invalid protocol specified. Supported values: ${supportedProtocols.join(', ')}`)
  }
  // TODO: Is this okay to look up once per plugin?
  const Protocol: TProtocolConstructor = getProtocol(protocol)

  // TODO: Should this be constructed once per plugin or once per request?
  const service: TProcessor = getService(Service, handlers)

  async function handler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction): Promise<void> {
    try {
      const result = await process(service, request.body, Transport, Protocol, request)
      response.status(200).end(result)
    } catch (err) {
      next(err)
    }
  }

  return handler
}
