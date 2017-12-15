import { CoreOptions, OptionsWithUri, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import {
  IInitArgs,
  IInitResult,
  IListResult,
  IReadResult,
  ISealStatusResult,
  IStatusResult,
  IUnsealArgs,
  IUnsealResult,
} from './types'

import {
  HVFail,
  HVMissingResource,
} from './errors'

import * as utils from './utils'

const request = rpn.defaults({
  json: true,
  resolveWithFullResponse: true,
  simple: false,
})

function responseAsError(res: RequestResponse): HVFail {
  let message: string
  if (res.body && res.body.errors && res.body.errors.length > 0) {
    message = res.body.errors[0]
  } else {
    message = `Status ${res.statusCode}`
  }

  return new HVFail(message)
}

function fetch(options: OptionsWithUri, token?: string): Promise<any> {
  const requestOptions: OptionsWithUri = (
    (token !== undefined) ?
      utils.deepMerge(options, {
        headers: {
          'X-Vault-Token': token,
        },
      }) :
      options
  )

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

export interface IVaultServiceArgs {
  destination: string
  apiVersion?: 'v1'
  requestOptions?: CoreOptions
}

export class VaultService {
  private defaultOptions: CoreOptions
  private dest: string

  constructor({
    destination,
    apiVersion = 'v1',
    requestOptions = {},
  }: IVaultServiceArgs) {
    this.defaultOptions = requestOptions
    this.dest = `${destination}/${apiVersion}`
  }

  public status(options: CoreOptions = {}): Promise<IStatusResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/sys/init`,
      method: 'GET',
    }))
  }

  public init(data: IInitArgs, options: CoreOptions = {}): Promise<IInitResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/sys/init`,
      json: data,
      method: 'PUT',
    }))
  }

  public sealStatus(options: CoreOptions = {}): Promise<ISealStatusResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/sys/seal-status`,
      method: 'GET',
    }))
  }

  public seal(token: string, options: CoreOptions = {}): Promise<void> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/sys/seal`,
      method: 'PUT',
    }), token)
  }

  public unseal(data: IUnsealArgs, options: CoreOptions = {}): Promise<IUnsealResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/sys/unseal`,
      json: data,
      method: 'PUT',
    }))
  }

  public read(path: string, token: string, options: CoreOptions = {}): Promise<IReadResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/${path}`,
      method: 'GET',
    }), token)
  }

  public list(token: string, options: CoreOptions = {}): Promise<IListResult> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/secret?list=true`,
      method: 'GET',
    }), token)
  }

  public write(path: string, data: any, token: string, options: CoreOptions = {}): Promise<void> {
    return fetch(utils.deepMerge(this.defaultOptions, options, {
      uri: `${this.dest}/${path}`,
      json: data,
      method: 'POST',
    }), token)
  }
}
