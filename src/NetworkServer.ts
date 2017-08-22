export interface INetworkServerCtor {
  new(options: any): INetworkServer
}
export interface INetworkServer {
  start()
}
