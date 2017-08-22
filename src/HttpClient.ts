import { INetworkClient } from './NetworkClient'

export class HttpClient implements INetworkClient {
  public port: number

  constructor(options) {
    this.port = options.port
  }
}
