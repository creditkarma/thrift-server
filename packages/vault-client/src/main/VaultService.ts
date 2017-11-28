import { CoreOptions, OptionsWithUri, RequestResponse } from 'request'
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

const request = rpn.defaults({
  json: true,
  resolveWithFullResponse: true,
  simple: false,
})

class HVMissingResource extends Error {
  constructor(location: string | url.Url) {
    super(`Unable to locate vault resource at: ${location}`)
  }
}

class HVFail extends Error {
  constructor(message?: string) {
    super(message)
  }
}

function responseAsError(res: RequestResponse): HVFail {
  let message: string
  if (res.body && res.body.errors && res.body.errors.length > 0) {
    message = res.body.errors[0]
  } else {
    message = `Status ${res.statusCode}`
  }

  return new HVFail(message)
}

function fetch(options: OptionsWithUri, token: string = ''): Promise<any> {
  const requestOptions: OptionsWithUri = deepMerge(options, {
    headers: {
      'X-Vault-Token': token,
    },
  })

  return request(requestOptions).then((res: RequestResponse) => {
    switch (res.statusCode) {
      case 200:
      case 204:
        return Promise.resolve(res.body)

      case 404:
        return Promise.reject(new HVMissingResource(requestOptions.uri))

      default:
        return Promise.reject(responseAsError(res))
    }
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

  public status(options: CoreOptions = {}): Promise<IStatusResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/sys/init`,
      method: 'GET',
    }))
  }

  public init(data: IInitArgs, options: CoreOptions = {}): Promise<IInitResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/sys/init`,
      json: data,
      method: 'PUT',
    }))
  }

  public sealStatus(options: CoreOptions = {}): Promise<ISealStatusResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/sys/seal-status`,
      method: 'GET',
    }))
  }

  public seal(token: string, options: CoreOptions = {}): Promise<void> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/sys/seal`,
      method: 'PUT',
    }), token)
  }

  public unseal(data: IUnsealArgs, options: CoreOptions = {}): Promise<IUnsealResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/sys/unseal`,
      json: data,
      method: 'PUT',
    }))
  }

  public read(path: string, token: string, options: CoreOptions = {}): Promise<IReadResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/${path}`,
      method: 'GET',
    }), token)
  }

  public list(token: string, options: CoreOptions = {}): Promise<IListResult> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/secret?list=true`,
      method: 'GET',
    }), token)
  }

  public write(path: string, data: any, token: string, options: CoreOptions = {}): Promise<void> {
    return fetch(deepMerge(options, {
      uri: `${this.dest}/${path}`,
      json: data,
      method: 'POST',
    }), token)
  }
}
