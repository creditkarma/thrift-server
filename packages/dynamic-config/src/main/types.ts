export interface IRemoteOptions {
  [name: string]: any
}

export interface IConfigOptions {
  configPath?: string
  configEnv?: string
  remoteOptions?: IRemoteOptions
}

export interface IConsulOptions {
  consulAddress?: string
  consulKvDc?: string
  consulKeys?: string
}

export interface IRemoteOverrides {
  key: string
  [name: string]: string
}

// CONFIG TYPES

export type SourceType =
  'local' | 'remote' | 'secret'

export interface IConfigValue {
  source: SourceType
  resolved: boolean
  timestamp: number
  value: string | number | boolean | IConfigValue
}

export interface IConfig {
  [key: string]: IConfigValue
}

// CONFIG PLACEHOLDER TYPES

export type ResolverType =
  'remote' | 'secret'

export interface IResolvedPlaceholder {
  name: string
  key: string
  type: ResolverType
  default?: any
}

export interface IConfigPlaceholder {
  key: string
  default?: any
}

export type ConfigPlaceholder =
  IConfigPlaceholder | string

// UTILITY TYPES

export type ObjectUpdate =
  [ Array<string>, Promise<any> ]

// SCHEMA TYPES

export interface ISchemaMap {
  [key: string]: ISchema
}

export type ISchema =
  IArraySchema | IObjectSchema | IStringSchema | INumberSchema |
  IBooleanSchema | IAnySchema | IUndefinedSchema

export interface IArraySchema {
  type: 'array'
  items: ISchema
}

export interface IObjectSchema {
  type: 'object'
  properties: ISchemaMap
  required?: Array<string>
}

export interface IStringSchema {
  type: 'string'
}

export interface INumberSchema {
  type: 'number'
}

export interface IBooleanSchema {
  type: 'boolean'
}

export interface IAnySchema {
  type: 'any'
}

export interface IUndefinedSchema {
  type: 'undefined'
}
