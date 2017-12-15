export interface IConfigOptions {
  consulAddress?: string
  consulKvDc?: string
  consulKeys?: string
  configPath?: string
  configEnv?: string
}

export interface IConfigPlaceholder {
  default?: any
  key: string
}

export type ConfigPlaceholder =
  IConfigPlaceholder | string

export type ObjectUpdate =
  [ Array<string>, Promise<any> ]

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
