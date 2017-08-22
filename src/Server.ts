import { INetwork } from './Network'
import { INetworkServer } from './NetworkServer'

export interface IServer {
  network(INetwork, options?: any)
  services(mountPath: string, service: any, handlers: any)
  start()
}

export class Server implements IServer {
  public name: string
  public net: INetworkServer

  constructor(name: string) {
    this.name = name
  }

  public network({ server: ServerCtor }: INetwork, options?: any) {
    this.net = new ServerCtor(options)

    return this
  }

  public services(mountPath: string, service: any, handlers: any) {
    // TODO

    return this
  }

  public start(): Promise<number> {
    return this.net.start()
  }
}
