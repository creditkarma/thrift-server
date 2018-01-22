import { DynamicConfig } from '../DynamicConfig'

import {
  IConsulOptions,
  IRemoteResolver,
  ObjectType,
} from '../types'

import {
  MissingProcessVariable,
} from '../errors'

import {
  ConfigUtils,
  Utils,
} from '../utils'

import * as logger from '../logger'

export function processResolver(): IRemoteResolver {
  return {
    type: 'remote',
    name: 'process',
    init(configInstance: DynamicConfig, remoteOptions: IConsulOptions = {}): Promise<any> {
      return Promise.resolve({})
    },
    get<T = any>(key: string, type?: ObjectType): Promise<T> {
      const value = Utils.readValueFromArgs(key, process.argv)
      if (value !== undefined) {
        if (type !== undefined) {
          return ConfigUtils.readValueForType(value, type)

        } else {
          return Promise.resolve(value) as any
        }

      } else {
        logger.error(`Error retrieving key[${key}] from command line arguments`)
        return Promise.reject(new MissingProcessVariable(key))
      }
    },
  }
}
