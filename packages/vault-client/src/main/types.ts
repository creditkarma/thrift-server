import { CoreOptions } from 'request'

export interface IServiceConfig {
  apiVersion: 'v1'
  destination: string,
  requestOptions: CoreOptions
}

export interface IHVConfig {
  apiVersion: 'v1'
  destination: string,
  requestOptions: CoreOptions
  namespace: string
  tokenPath: string
}

export interface IStatusResult {
  initialized: true
}

export interface IInitArgs {
  secret_shares: number
  secret_threshold: number
}

export interface IInitResult {
  keys: Array<string>
  keys_base64: Array<string>
  root_token: string
}

export interface IUnsealArgs {
  key?: string
  reset?: boolean
}

export interface IUnsealResult {
  sealed: boolean
  t: number
  n: number
  progress: number
  version: string
  cluster_name: string
  cluster_id: string
}

export interface ISealStatusResult {
  sealed: boolean
  t: number
  n: number
  progress: number
  version: string
}

export interface IListResult {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
  data: { keys: Array<string> }
  wrap_info: any
  warnings: any
  auth: any
}

export interface IReadResult {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
  data: any
  wrap_info: any
  warnings: any
  auth: any
}
