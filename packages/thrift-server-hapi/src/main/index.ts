import * as Hapi from 'hapi'

import {
  getProtocol,
  getTransport,
  IProtocolConstructor,
  IThriftProcessor,
  ITransportConstructor,
  process,
  ProtocolType,
  TProtocol,
  TransportType,
} from '@creditkarma/thrift-server-core'

export interface IHandlerOptions<TProcessor> {
  service: TProcessor
}

export interface IPluginOptions {
  transport?: TransportType
  protocol?: ProtocolType
}

export interface IThriftContext {
  method: string
}

export type ThriftHapiPlugin =
  Hapi.PluginRegistrationObject<IPluginOptions>

function readThriftMethod(buffer: Buffer, Transport: ITransportConstructor, Protocol: IProtocolConstructor): string {
  const transportWithData = new Transport(buffer)
  const input: TProtocol = new Protocol(transportWithData)
  const { fieldName } = input.readMessageBegin()

  return fieldName
}

export function createPlugin<TProcessor extends IThriftProcessor<Hapi.Request>>(): ThriftHapiPlugin {
  const plugin: Hapi.PluginRegistrationObject<IPluginOptions> = {
    register(server: Hapi.Server, pluginOptions: IPluginOptions, next) {
      const Transport: ITransportConstructor = getTransport(pluginOptions.transport)
      const Protocol: IProtocolConstructor = getProtocol(pluginOptions.protocol)

      server.handler('thrift', (route: Hapi.RoutePublicInterface, options: IHandlerOptions<TProcessor>) => {
        const service = options.service
        if (!service) {
          throw new Error('No service implementation specified.')
        }

        return (request: Hapi.Request, reply: Hapi.ReplyNoContinue) => {
          try {
            const method: string = readThriftMethod(request.payload, Transport, Protocol)
            request.plugins.thrift = Object.assign({}, request.plugins.thrift, { method })
          } catch (err) {
            reply(err)
          }

          reply(process(service, request.payload, Transport, Protocol, request))
        }
      })

      next()
    },
  };

  (plugin.register as any).attributes = {
    pkg: require('../../package.json'),
  }

  return plugin
}

export const ThriftPlugin: ThriftHapiPlugin = createPlugin<any>()
