export interface IConfigMap {
  [env: string]: object
}

export interface IConfigOptions {
  consulAddress?: string
  consulKvDc?: string
  consulKeys?: string
  configPath?: string
  configEnv?: string
}
