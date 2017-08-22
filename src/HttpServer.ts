import * as http from 'http'

import { INetworkServer } from './NetworkServer'

export class HttpServer implements INetworkServer {
  public port?: number
  public hostname?: string
  public backlog?: number

  public services: Map<string, any>

  constructor(options) {
    this.port = options.port
    this.hostname = options.hostname
    this.backlog = options.backlog
  }

  public mount(path: string, service: any, handlers: any) {
    if (this.services.has(path)) {
      throw new Error(`Service already mounted at ${path}`);
    }
    this.services.set(path, service)
    // TODO
  }

  public start(): Promise<number> {
    const httpServer = http.createServer(this.onRequest)

    return new Promise((resolve, reject) => {
      httpServer.listen(this.port, this.hostname, this.backlog, () => {
        const port = httpServer.address().port
        resolve(port)
      })
    })
  }

  private onRequest(req, res) {
    console.log(req, res)
  }
}
