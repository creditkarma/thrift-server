import {
  TProtocol,
  TTransport,
} from 'thrift'

import {
  HttpConnection,
} from './connections'

export function createClient<TClient>(
  ServiceClient: { new (output: TTransport, pClass: { new (trans: TTransport): TProtocol }): TClient; },
  connection: HttpConnection<TClient>,
): TClient {
  const client: TClient = new ServiceClient(
    new connection.Transport(undefined, (data: Buffer, seqid: number): void => {
      connection.send(data, seqid)
    }),
    connection.Protocol
  )

  connection.setClient(client)

  return client
}
