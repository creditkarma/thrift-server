export * from './connection'
export * from './axios'
export * from './request'
export * from './types'

import { AxiosInstance, AxiosRequestConfig } from 'axios'
import * as request from 'request'

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
  options: IHttpConnectionOptions): HttpConnection<TClient, AxiosRequestConfig> {
  return new AxiosConnection<TClient>(requestApi, options)
}

export function fromRequest<TClient>(
  requestApi: RequestInstance,
  options: IHttpConnectionOptions): HttpConnection<TClient, request.CoreOptions> {
  return new RequestConnection<TClient>(requestApi, options)
}
