export interface IHttpConnectionOptions {
  hostName: string
  port: number
}

export interface IHttpConnection {
  write(dataToWrite: Buffer): Promise<Buffer>
}
