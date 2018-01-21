import {
  IConsulDeleteRequest,
  IConsulGetRequest,
  IConsulUpdateRequest,
  RequestType,
} from './types'

export const DEFAULT_GET_REQUEST: IConsulGetRequest = {
  type: RequestType.GetRequest,
  apiVersion: 'v1',
  section: 'kv',
  subsection: undefined,
  index: 0,
  key: { path: '' },
  token: '',
}

export function getRequest(options: Partial<IConsulGetRequest>): IConsulGetRequest {
  return Object.assign(DEFAULT_GET_REQUEST, options)
}

export const DEFAULT_UPDATE_REQUEST: IConsulUpdateRequest = {
  type: RequestType.UpdateRequest,
  apiVersion: 'v1',
  section: 'kv',
  subsection: undefined,
  index: 0,
  key: { path: '' },
  value: '',
}

export function updateRequest(options: Partial<IConsulUpdateRequest>): IConsulUpdateRequest {
  return Object.assign(DEFAULT_UPDATE_REQUEST, options)
}

export const DEFAULT_DELETE_REQUEST: IConsulDeleteRequest = {
  type: RequestType.DeleteRequest,
  apiVersion: 'v1',
  section: 'kv',
  subsection: undefined,
  index: 0,
  key: { path: '' },
}

export function deleteRequest(options: Partial<IConsulDeleteRequest>): IConsulDeleteRequest {
  return Object.assign(DEFAULT_DELETE_REQUEST, options)
}
