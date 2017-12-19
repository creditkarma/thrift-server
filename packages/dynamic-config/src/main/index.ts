import { DynamicConfig } from './DynamicConfig'

// import { SyncConfig } from './SyncConfig'
import {
  IConfigOptions,
} from './types'

import { defaultConsulResolver, defaultVaultResolver } from './resolvers'

export * from './ConfigLoader'
export { DynamicConfig } from './DynamicConfig'
// export * from './SyncConfig'
export * from './constants'
export * from './types'
export * from './resolvers'

// DEFAULT CONFIG CLIENT

let configInstance: DynamicConfig

export function config(options: IConfigOptions = {}): DynamicConfig {
  if (configInstance === undefined) {
    configInstance = new DynamicConfig(options)
    configInstance.register(
      defaultConsulResolver(),
      defaultVaultResolver(),
    )
  }

  return configInstance
}

// DEFAULT SYNC CONFIG CLIENT

// let syncInstance: SyncConfig

// export async function getSyncConfig(options: IConfigOptions = {}): Promise<SyncConfig> {
//   if (syncInstance === undefined) {
//     syncInstance = await SyncConfig.getSyncConfig(options)
//   }

//   return syncInstance
// }
