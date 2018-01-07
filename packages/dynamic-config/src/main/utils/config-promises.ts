import {
  BaseConfigValue,
  ConfigValue,
  ObjectUpdate,
  PromisedUpdate,
} from '../types'

import * as ConfigUtils from './config'
import * as ConfigBuilder from './config-builder'

/**
 * The first value in this tuple is the resolved value of the promise
 * The second value is the in-order index of this Promise so that promises are applied in
 * the same order in which they occur in the object
 */
type PromiseUpdate = [BaseConfigValue, number]

/**
 * Recursively traverses an object, looking for keys with Promised values and returns a Promise of
 * the object with all nested Promises resolved.
 */
export async function valuesForPromises(promises: Array<Promise<BaseConfigValue>>): Promise<Array<BaseConfigValue>> {
  return Promise.all(promises.map((next: Promise<BaseConfigValue>, index: number) => {
    return resolveAtIndex(next, index)
  })).then((values: Array<PromiseUpdate>): Array<BaseConfigValue> => {
    return processValues(values)
  })
}

function processValues(values: Array<PromiseUpdate>): Array<BaseConfigValue> {
  return values.sort((a: PromiseUpdate, b: PromiseUpdate) => {
    if (a[1] < b[1]) {
      return -1
    } else {
      return 1
    }
  }).map((next: PromiseUpdate) => {
    return next[0]
  })
}

function resolveAtIndex(promise: Promise<BaseConfigValue>, index: number): Promise<PromiseUpdate> {
  return new Promise((resolve, reject) => {
    promise.then((val: BaseConfigValue) => {
      return resolve([val, index])
    })
  })
}

function appendUpdatesForObject(value: any, path: Array<string>, updates: Array<ObjectUpdate>): void {
  if (value instanceof Promise) {
    updates.push([ path, value ])

  } else if (typeof value === 'object') {
    collectUnresolvedPromises(value, path, updates)
  }
}

async function handleUnresolved(unresolved: Array<PromisedUpdate>, base: ConfigValue): Promise<ConfigValue> {
  const paths: Array<string> = unresolved.map((next: PromisedUpdate) => next[0].join('.'))
  const promises: Array<Promise<BaseConfigValue>> = unresolved.map((next: PromisedUpdate) => next[1])
  const resolvedPromises: Array<ConfigValue> = await Promise.all(promises.map((next: Promise<BaseConfigValue>) => {
    return next.then((val: BaseConfigValue) => {
      const nested: Array<PromisedUpdate> = collectUnresolvedPromises(val)
      if (nested.length > 0) {
        return handleUnresolved(nested, val)
      } else {
        return Promise.resolve(val)
      }
    })
  }))

  const newObj: ConfigValue = resolvedPromises.reduce(
    (acc: ConfigValue, next: BaseConfigValue, currentIndex: number): ConfigValue => {
      return ConfigUtils.setValueForKey(paths[currentIndex], next, acc)
    },
    base,
  )

  return newObj
}

function collectUnresolvedPromises(
  configValue: ConfigValue,
  path: Array<string> = [],
  updates: Array<PromisedUpdate> = [],
): Array<PromisedUpdate> {
  if (configValue.type === 'array') {
    for (let i = 0; i < configValue.items.length; i++) {
      const value = configValue.items[i]
      const newPath: Array<string> = [ ...path, `${i}` ]
      appendUpdatesForObject(value, newPath, updates)
    }

    return updates

  } else if (configValue.type === 'promise') {
    updates.push([ path, configValue.value.then((value: any) => {
      return ConfigBuilder.buildBaseConfigValue(configValue.source.name, configValue.source.type, value)
    }) ])

    return updates

  } else if (configValue.type === 'object' || configValue.type === 'root') {
    for (const key of Object.keys(configValue.properties)) {
      const value = configValue.properties[key]
      const newPath: Array<string> = [ ...path, key ]
      appendUpdatesForObject(value, newPath, updates)
    }

    return updates

  } else {
    return []
  }
}

export async function resolveConfigPromises(configValue: ConfigValue): Promise<ConfigValue> {
  if (configValue.type === 'promise') {
    return configValue.value.then((val: any) => {
      return resolveConfigPromises(ConfigBuilder.buildBaseConfigValue(
        configValue.source.name,
        configValue.source.type,
        val,
      ))
    })

  } else if (configValue.type === 'object' || configValue.type === 'root') {
    const unresolved: Array<ObjectUpdate> = collectUnresolvedPromises(configValue)
    return handleUnresolved(unresolved, configValue)

  } else {
    return configValue
  }
}
