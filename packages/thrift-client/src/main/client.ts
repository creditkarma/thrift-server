import {
  TProtocol,
  TTransport,
} from 'thrift'

import {
  HttpConnection,
} from './connections'

export interface IClientConstructor<TClient, Context> {
  new (
    output: TTransport,
    pClass: { new (trans: TTransport): TProtocol },
    callback: (data: Buffer, seqid: number, context?: Context) => void,
  ): TClient
}

export function createClient<TClient, Context>(
  ServiceClient: IClientConstructor<TClient, Context>,
  connection: HttpConnection<TClient, Context>,
): TClient {
  const transport: TTransport = new connection.Transport(undefined)
  const client: TClient = new ServiceClient(
    transport,
    connection.Protocol,
    (data: Buffer, seqid: number, context?: Context): void => {
      connection.send(data, seqid, context)
    },
  )

  connection.setClient(client)

  return client
}
