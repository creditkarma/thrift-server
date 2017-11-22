import * as rpn from 'request-promise-native'
import * as url from 'url'

import {
  IInitArgs,
  IInitResult,
  IListResult,
  IReadResult,
  ISealStatusResult,
  IServiceConfig,
  IStatusResult,
  IUnsealArgs,
  IUnsealResult,
} from './types'

import { deepMerge } from './utils'

export const tokenHeader: string = 'X-Vault-Token'

export interface IRequestOptions {
  url: string | url.Url
  method: 'GET' | 'PUT' | 'DELETE' | 'POST',
  headers: { [name: string]: string | Array<string> }
}

const request = rpn.defaults({
  json: true,
  resolveWithFullResponse: true,
  simple: false,
})

function fetch(options: IRequestOptions, config: IServiceConfig, token: string = ''): Promise<any> {
  const requestOptions: IRequestOptions = deepMerge(options, {
    headers: {
      'X-Vault-Token': token,
    },
  })

  return request(requestOptions).then((res: any) => {
    if (res.statusCode !== 200 && res.statusCode !== 204) {
      let message: string
      if (res.body && res.body.errors && res.body.errors.length > 0) {
        message = res.body.errors[0]
      } else {
        message = `Status ${res.statusCode}`
      }
      const error: Error = new Error(message)
      return Promise.reject(error)
    }
    return Promise.resolve(res.body)
  }, (err: any) => {
    return err
  })
}

export class VaultService {
  protected config: IServiceConfig
  private dest: string

  constructor(config: IServiceConfig) {
    this.config = config
    this.dest = `${config.destination}/${config.apiVersion}`
  }

  public status(): Promise<IStatusResult> {
    const options: any = {
      uri: `${this.dest}/sys/init`,
      method: 'GET',
    }
    return fetch(options, this.config)
  }

  public init(data: IInitArgs): Promise<IInitResult> {
    const options: any = {
      uri: `${this.dest}/sys/init`,
      json: data,
      method: 'PUT',
    }
    return fetch(options, this.config)
  }

  public sealStatus(): Promise<ISealStatusResult> {
    const options: any = {
      uri: `${this.dest}/sys/seal-status`,
      method: 'GET',
    }
    return fetch(options, this.config)
  }

  public seal(token: string): Promise<void> {
    const options: any = {
      uri: `${this.dest}/sys/seal`,
      method: 'PUT',
    }
    return fetch(options, this.config, token)
  }

  public unseal(data: IUnsealArgs): Promise<IUnsealResult> {
    const options: any = {
      uri: `${this.dest}/sys/unseal`,
      json: data,
      method: 'PUT',
    }
    return fetch(options, this.config)
  }

  public read(path: string, token: string): Promise<IReadResult> {
    const options: any = {
      uri: `${this.dest}/${path}`,
      method: 'GET',
    }
    return fetch(options, this.config, token)
  }

  public list(token: string): Promise<IListResult> {
    const options: any = {
      uri: `${this.dest}/secret?list=true`,
      method: 'GET',
    }
    return fetch(options, this.config, token)
  }

  public write(path: string, data: any, token: string): Promise<void> {
    const options: any = {
      uri: `${this.dest}/${path}`,
      json: data,
      method: 'POST',
    }
    return fetch(options, this.config, token)
  }
}
