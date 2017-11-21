export * from './connection'
export * from './axios'
export * from './request'
export * from './types'

import { AxiosInstance } from 'axios'

import {
  AxiosConnection,
} from './axios'

import {
  RequestConnection,
  RequestInstance,
} from './request'

import {
  IHttpConnectionOptions,
} from './types'

export function fromAxios<TClient>(
  requestApi: AxiosInstance,
  options: IHttpConnectionOptions): AxiosConnection<TClient> {
  return new AxiosConnection<TClient>(requestApi, options)
}

export function fromRequest<TClient>(
  requestApi: RequestInstance,
  options: IHttpConnectionOptions): RequestConnection<TClient> {
  return new RequestConnection<TClient>(requestApi, options)
}
