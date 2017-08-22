import {
  INetworkServerCtor,
} from './NetworkServer'

import {
  INetworkClientCtor,
} from './NetworkClient'

export interface INetwork {
  client: INetworkClientCtor
  server: INetworkServerCtor
}
