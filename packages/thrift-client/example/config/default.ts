export interface IConnectionConfig {
  host: string
  port: number
}

export const server: IConnectionConfig = {
  host: 'localhost',
  port: 8045
}

export const client: IConnectionConfig = {
  host: 'localhost',
  port: 8080
}
