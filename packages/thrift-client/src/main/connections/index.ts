export * from './connection'
export * from './axios'
export * from './request'

import { AxiosInstance } from 'axios'

import {
  HttpConnection,
} from './connection'

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
  options: IHttpConnectionOptions): HttpConnection<TClient> {
  return new AxiosConnection<TClient>(requestApi, options)
}

export function fromRequest<TClient>(
  requestApi: RequestInstance,
  options: IHttpConnectionOptions): HttpConnection<TClient> {
  return new RequestConnection<TClient>(requestApi, options)
}
