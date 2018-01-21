export const enum RequestType {
  GetRequest = 'GetRequest',
  UpdateRequest = 'UpdateRequest',
  DeleteRequest = 'DeleteRequest',
}

export interface IQueryMap {
  [key: string]: string | number | boolean | undefined
}

export interface IKey {
  path: string
  dc?: string
}

export interface IConsulRequest {
  type: RequestType
  apiVersion: 'v1'
  key: IKey
  token?: string
  index?: number
  subsection?: string
  section?: string
}

export interface IConsulGetRequest extends IConsulRequest {
  type: RequestType.GetRequest
  section: 'kv'
}

export interface IConsulUpdateRequest<T = any> extends IConsulRequest {
  type: RequestType.UpdateRequest
  section: 'kv'
  value: T
}

export interface IConsulDeleteRequest extends IConsulRequest {
  type: RequestType.DeleteRequest
  section: 'kv'
}

export type ConsulRequest<T = any> =
  IConsulGetRequest | IConsulUpdateRequest<T> | IConsulDeleteRequest

export interface IConsulMetadata {
  CreateIndex: number
  ModifyIndex: number
  LockIndex: number
  Key: string
  Flags: number
  Value: string // base-64 encoded
  Session: string
}
