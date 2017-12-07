import { DynamicConfig } from './DynamicConfig'
import { SyncConfig } from './SyncConfig'
import { IConfigOptions } from './types'

export * from './ConfigLoader'
export * from './DynamicConfig'
export * from './SyncConfig'
export * from './constants'
export * from './types'

let configInstance: DynamicConfig
let syncInstance: SyncConfig

export function getConfig(options: IConfigOptions = {}): DynamicConfig {
  if (configInstance === undefined) {
    configInstance = new DynamicConfig(options)
  }

  return configInstance
}

export async function getSyncConfig(options: IConfigOptions = {}): Promise<SyncConfig> {
  if (syncInstance === undefined) {
    syncInstance = await SyncConfig.getSyncConfig(options)
  }

  return syncInstance
}
