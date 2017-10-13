import {
  getProtocol,
  getService,
  getTransport,
  IThriftProcessor,
  process,
  ProtocolType,
  TransportType,
} from '@creditkarma/thrift-server-core'

import {
  TProcessorConstructor,
  TProtocolConstructor,
  TTransportConstructor,
} from 'thrift'

import * as express from 'express'

export interface IPluginOptions {
  transport?: TransportType
  protocol?: ProtocolType
}

export function thriftExpress<TProcessor extends IThriftProcessor<express.Request>, THandler>(
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
