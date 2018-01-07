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

export interface IDynamicConfig {
  register(...resolvers: Array<ConfigResolver>): void
  get<T = any>(key?: string): Promise<T>
  getAll(...args: Array<string>): Promise<Array<any>>
  getWithDefault<T = any>(key: string, defaultVal: T): Promise<T>
  getRemoteValue<T>(key: string): Promise<T>
  getSecretValue<T>(key: string): Promise<T>
}

// RESOLVER TYPES

export interface IResolverMap {
  names: Set<string>
  all: Map<string, ConfigResolver>
}

export type ConfigResolver =
  IRemoteResolver | ISecretResolver

export type IRemoteInitializer = (dynamicConfig: IDynamicConfig, remoteOptions?: IRemoteOptions) => Promise<any>

export interface IRemoteResolver {
  type: 'remote'
  name: string
  init: IRemoteInitializer
  get<T>(key: string): Promise<T>
}

export interface ISecretResolver {
  type: 'secret'
  name: string
  init: IRemoteInitializer
  get<T>(key: string): Promise<T>
}

// CONFIG TYPES

export type SourceType =
  'local' | 'remote' | 'secret'

export interface ISource {
  type: SourceType
  name: string
}

export type ObjectType =
  'root' | 'object' | 'array' | 'string' |
  'number' | 'boolean' | 'promise' | 'placeholder'

export type WatchFunction =
  (val: any) => void

export interface IConfigValue {
  type: ObjectType
}

export interface IBaseConfigValue extends IConfigValue {
  source: ISource
  resolved: boolean
  watchers: Array<WatchFunction>
}

export type ConfigValue =
  IRootConfigValue | BaseConfigValue

export type BaseConfigValue =
  IObjectConfigValue | IArrayConfigValue | IPrimitiveConfigValue |
  IPromisedConfigValue | IPlaceholderConfigValue

export interface IConfigProperties {
  [name: string]: BaseConfigValue
}

export interface IRootConfigValue extends IConfigValue {
  type: 'root'
  properties: IConfigProperties
}

export interface IObjectConfigValue extends IBaseConfigValue {
  type: 'object'
  properties: IConfigProperties
}

export interface IArrayConfigValue extends IBaseConfigValue {
  type: 'array'
  items: Array<any>
}

export interface IPrimitiveConfigValue extends IBaseConfigValue {
  type: 'string' | 'number' | 'boolean'
  value: string | number | boolean
}

export interface IPromisedConfigValue extends IBaseConfigValue {
  type: 'promise'
  resolved: false
  value: Promise<any>
}

export interface IPlaceholderConfigValue extends IBaseConfigValue {
  type: 'placeholder'
  value: IConfigPlaceholder
}

// CONFIG PLACEHOLDER TYPES

export type ResolverType =
  'remote' | 'secret'

export interface IConfigPlaceholder {
  key: string
  default?: any
}

export interface IResolvedPlaceholder {
  name: string
  key: string
  type: ResolverType
  default?: any
}

// UTILITY TYPES

export type ObjectUpdate =
  [ Array<string>, Promise<any> ]

export type PromisedUpdate =
  [ Array<string>, Promise<BaseConfigValue> ]

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
  required?: boolean
}

export interface IObjectSchema {
  type: 'object'
  properties: ISchemaMap
  required?: boolean
}

export interface IStringSchema {
  type: 'string'
  required?: boolean
}

export interface INumberSchema {
  type: 'number'
  required?: boolean
}

export interface IBooleanSchema {
  type: 'boolean'
  required?: boolean
}

export interface IAnySchema {
  type: 'any'
  required?: boolean
}

export interface IUndefinedSchema {
  type: 'undefined'
  required?: boolean
}
