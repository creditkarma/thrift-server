import {
  ProtocolType,
  TransportType,
} from '@creditkarma/thrift-server-core'

export interface IHttpConnectionOptions {
  hostName: string
  port: number
  path?: string
  https?: boolean
  transport?: TransportType
  protocol?: ProtocolType
}
