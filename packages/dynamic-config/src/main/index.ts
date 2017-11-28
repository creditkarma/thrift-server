import { DynamicConfig } from './DynamicConfig'

export * from './ConfigLoader'
export * from './DynamicConfig'
export * from './constants'
export * from './types'

let configInstance: DynamicConfig

export function getConfig(): DynamicConfig {
  if (configInstance === undefined) {
    configInstance = new DynamicConfig()
  }

  return configInstance
}
