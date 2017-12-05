import {
  TProtocol,
  TTransport,
} from '@creditkarma/thrift-server-core'

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
  const client: TClient = new ServiceClient(
    new connection.Transport(),
    connection.Protocol,
    (data: Buffer, requestId: number, context?: Context): void => {
      connection.send(data, requestId, context)
    },
  )

  connection.setClient(client)

  return client
}
