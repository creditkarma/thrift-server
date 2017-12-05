import {
  getProtocol,
  getService,
  getTransport,
  IProcessorConstructor,
  IProtocolConstructor,
  IThriftProcessor,
  ITransportConstructor,
  process,
  ProtocolType,
  TransportType,
} from '@creditkarma/thrift-server-core'

import * as express from 'express'

export interface IPluginOptions {
  transport?: TransportType
  protocol?: ProtocolType
}

export function thriftExpress<TProcessor extends IThriftProcessor<express.Request>, THandler>(
  Service: IProcessorConstructor<TProcessor, THandler>,
  handlers: THandler,
  options: IPluginOptions = {}): express.RequestHandler {

  const Transport: ITransportConstructor = getTransport(options.transport)
  const Protocol: IProtocolConstructor = getProtocol(options.protocol)
  const service: TProcessor = getService(Service, handlers)

  return (request: express.Request, response: express.Response, next: express.NextFunction): void => {
    try {
      process(service, request.body, Transport, Protocol, request).then((result: any) => {
        response.status(200).end(result)
      }, (err: any) => {
        next(err)
      })
    } catch (err) {
      next(err)
    }
  }
}
