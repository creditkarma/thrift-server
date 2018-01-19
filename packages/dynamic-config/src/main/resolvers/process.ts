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
} from '../utils'

import * as logger from '../logger'

const MALFORMED_ARGUMENT = '<Error[malformed argument]>'

export function readValueFromArgs(key: string, args: Array<string>): string | undefined {
  return args.filter((next: string) => {
    return next.startsWith(key)
  }).map((match: string) => {
    const parts = match.split('=')
    if (parts.length === 2) {
      return parts[1]

    } else {
      return MALFORMED_ARGUMENT
    }
  }).filter((next: string) => {
    return next !== MALFORMED_ARGUMENT
  })[0]
}

export function processResolver(): IRemoteResolver {
  return {
    type: 'remote',
    name: 'process',
    init(configInstance: DynamicConfig, remoteOptions: IConsulOptions = {}): Promise<any> {
      return Promise.resolve({})
    },
    get<T = any>(key: string, type?: ObjectType): Promise<T> {
      const value = readValueFromArgs(key, process.argv)
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
