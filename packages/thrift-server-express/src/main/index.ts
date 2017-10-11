import {
  getProtocol,
  getService,
  getTransport,
  IPluginOptions,
  IThirftProcessor,
  process,
} from '@creditkarma/thrift-server-core'

import {
  TProcessorConstructor,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

import * as express from 'express'

export function thriftExpress<TProcessor extends IThirftProcessor<express.Request>, THandler>(
  Service: TProcessorConstructor<TProcessor, THandler>,
  handlers: THandler,
  options: IPluginOptions = {}): express.RequestHandler {

  const Transport: TTransportConstructor = getTransport(options.transport)
  const Protocol: TProtocolConstructor = getProtocol(options.protocol)
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
