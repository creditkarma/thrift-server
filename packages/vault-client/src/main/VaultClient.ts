import { CoreOptions } from 'request'
import { getToken } from './discovery'
import { HVInvalidResponse } from './errors'
import { IHVConfig, IReadResult } from './types'
import * as utils from './utils'
import { VaultService } from './VaultService'

export interface IVaultClientArgs {
  apiVersion?: 'v1'
  destination?: string,
  requestOptions?: CoreOptions
  mount?: string
  namespace?: string
  tokenPath?: string
}

export class VaultClient {
  private service: VaultService
  private config: IHVConfig
  private token: string
  private mount: string
  private namespace: string

  constructor(config: IVaultClientArgs, service?: VaultService) {
    this.config = utils.resolveConfig(config)
    this.mount = this.config.mount
    this.namespace = this.config.namespace
    this.service = service || new VaultService(this.config)
  }

  public get<T>(key: string, options: CoreOptions = {}): Promise<T> {
    return this.getToken().then((tokenValue: string) => {
      const secretPath: string = utils.resolveSecretPath(this.mount, this.namespace, key)
      return this.service.read(secretPath, tokenValue, options).then((result: IReadResult) => {
        if (result.data && result.data.value) {
          return result.data.value
        } else {
          console.warn('Invalid response from Vault: ', result)
          throw new HVInvalidResponse(key)
        }
      })
    })
  }

  public set<T>(key: string, value: T, options: CoreOptions = {}): Promise<void> {
    return this.getToken().then((tokenValue: string) => {
      const secret: string = utils.resolveSecretPath(this.mount, this.namespace, key)
      return this.service.write(secret, { value }, tokenValue, options)
    })
  }

  private getToken(): Promise<string> {
    if (this.token !== undefined) {
      return Promise.resolve(this.token)
    } else {
      return getToken(this.config).then((tokenValue: string) => {
        this.token = tokenValue
        return tokenValue
      })
    }
  }
}
