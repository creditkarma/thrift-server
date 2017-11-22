import { CoreOptions } from 'request'
import { getToken } from './discovery'
import { IHVConfig, IReadResult } from './types'
import { cleanSecret, resolveConfig } from './utils'
import { VaultService } from './VaultService'

export class VaultClient {
  private service: VaultService
  private config: IHVConfig
  private token: string
  private namespace: string

  constructor(config: IHVConfig, service?: VaultService) {
    this.config = resolveConfig(config)
    this.namespace = config.namespace || ''
    this.service = service || new VaultService(this.config)
  }

  public get<T>(key: string, options: CoreOptions = {}): Promise<T> {
    return this.getToken().then((tokenValue: string) => {
      const secret: string = cleanSecret(this.namespace, key)
      return this.service.read(secret, tokenValue, options).then((result: IReadResult) => {
        if (result.data && result.data.value) {
          return result.data.value
        } else {
          throw new Error('Data returned from Vault has incorrect structure')
        }
      })
    })
  }

  public set<T>(key: string, value: T, options: CoreOptions = {}): Promise<void> {
    return this.getToken().then((tokenValue: string) => {
      const secret: string = cleanSecret(this.namespace, key)
      return this.service.write(secret, { value }, tokenValue, options)
    })
  }

  private getToken(): Promise<string> {
    if (this.token) {
      return Promise.resolve(this.token)
    } else {
      return getToken(this.config).then((tokenValue: string) => {
        this.token = tokenValue
        return tokenValue
      })
    }
  }
}
