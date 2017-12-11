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

export interface ISchema {
  type: 'array' | 'object' | 'string' | 'number' | 'boolean' | 'undefined'
  required?: boolean
  properties?: ISchemaMap
  items?: ISchema
}
