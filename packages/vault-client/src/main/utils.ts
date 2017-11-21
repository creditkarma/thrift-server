// import * as path from 'path'
import { IHVConfig } from './types'

function isObject(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object'
  )
}

export function deepMerge<Base, Update>(base: Base, update: Update): Base & Update {
  const newObj: any = {}
  const baseKeys: Array<string> = Object.keys(base)
  const updateKeys: Array<string> = Object.keys(update)

  for (const key of updateKeys) {
    if (baseKeys.indexOf(key) === -1) {
      baseKeys.push(key)
    }
  }

  for (const key of baseKeys) {
    if (base.hasOwnProperty(key) || update.hasOwnProperty(key)) {
      const baseValue: any = (base as any)[key]
      const updateValue: any = (update as any)[key]
      if (isObject(baseValue) && isObject(updateValue)) {
        newObj[key] = deepMerge(baseValue, updateValue)
      } else if (updateValue !== undefined) {
        newObj[key] = updateValue
      } else {
        newObj[key] = baseValue
      }
    }
  }

  return (newObj as Base & Update)
}

// export function cleanToken() {

// }

export const DEFAULT_CONFIG: IHVConfig = {
  protocol: 'http',
  apiVersion: 'v1',
  destination: '',
  hostHeader: '',
  namespace: '',
  tokenPath: '',
}

export function resolveConfig(options: Partial<IHVConfig>): IHVConfig {
  return deepMerge(DEFAULT_CONFIG, options)
}
