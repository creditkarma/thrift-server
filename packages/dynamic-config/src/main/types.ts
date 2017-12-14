export interface IConfigOptions {
  consulAddress?: string
  consulKvDc?: string
  consulKeys?: string
  configPath?: string
  configEnv?: string
}

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
