import { DynamicConfig } from './DynamicConfig'

import {
  IConfigOptions,
} from './types'

import {
  consulResolver,
  environmentResolver,
  processResolver,
  vaultResolver,
} from './resolvers'

export * from './ConfigLoader'
export { DynamicConfig } from './DynamicConfig'
export * from './constants'
export * from './types'
export * from './resolvers'
export * from './loaders'

// DEFAULT CONFIG CLIENT

let configInstance: DynamicConfig

export function config(options: IConfigOptions = {}): DynamicConfig {
  if (configInstance === undefined) {
    configInstance = new DynamicConfig({
      configPath: options.configPath,
      configEnv: options.configEnv,
      remoteOptions: options.remoteOptions,
      resolvers: (options.resolvers || []).concat([
        consulResolver(),
        vaultResolver(),
        environmentResolver(),
        processResolver(),
      ]),
      loaders: options.loaders,
    })
  }

  return configInstance
}
