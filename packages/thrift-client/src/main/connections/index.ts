export * from './HttpConnection'
export * from './AxiosConnection'
export * from './RequestConnection'

import { AxiosInstance } from 'axios'

import {
  AxiosConnection,
} from './AxiosConnection'

import {
  RequestConnection,
  RequestInstance,
} from './RequestConnection'

import {
  IHttpConnectionOptions,
} from '../types'

export function fromAxios(
  requestApi: AxiosInstance,
  options: IHttpConnectionOptions): AxiosConnection {
  return new AxiosConnection(requestApi, options)
}

export function fromRequest(
  requestApi: RequestInstance,
  options: IHttpConnectionOptions): RequestConnection {
  return new RequestConnection(requestApi, options)
}
