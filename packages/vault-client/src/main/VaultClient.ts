import { getToken } from './discovery'
import { IHVConfig, IReadResult } from './types'
import { resolveConfig } from './utils'
import { VaultService } from './VaultService'

export class VaultClient {
  private service: VaultService
  private config: IHVConfig
  private token: string

  constructor(config: IHVConfig, service?: VaultService) {
    this.config = resolveConfig(config)
    this.service = service || new VaultService(this.config)
  }

  public get<T>(key: string): Promise<T> {
    return this.getToken().then((tokenValue: string) => {
      return this.service.read(key, tokenValue).then((result: IReadResult) => {
        if (result.data && result.data.value) {
          return result.data.value
        } else {
          throw new Error('Data returned from Vault has incorrect structure')
        }
      })
    })
  }

  public set<T>(key: string, value: T): Promise<void> {
    return this.getToken().then((tokenValue: string) => {
      return this.service.write(key, { value }, tokenValue)
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
