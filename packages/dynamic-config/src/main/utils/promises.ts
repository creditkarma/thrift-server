import {
  ObjectUpdate,
} from '../types'

import {
  setValueForKey,
} from './object'

/**
 * Given an array of Promises return a new Promise that resolves with the value
 * of the first of the array to resolve, ignoring rejections. The resulting Promise
 * only rejects if all of the Promises reject.
 */
export async function race(promises: Array<Promise<any>>): Promise<any> {
  const count: number = promises.length
  let current: number = 0
  let resolved: boolean = false

  return new Promise((resolve, reject) => {
    promises.forEach((next: Promise<any>) => {
      next.then((val: any) => {
        if (!resolved) {
          resolved = true
          resolve(val)
        }
      }, (err: any) => {
        current++
        if (!resolved && current === count) {
          reject(new Error('All Promises rejected without success'))
        }
      })
    })
  })
}

/**
 * The first value in this tuple is the resolved value of the promise
 * The second value is the in-order index of this Promise so that promises are applied in
 * the same order in which they occur in the object
 */
type PromiseUpdate = [object, number]

/**
 * Recursively traverses an object, looking for keys with Promised values and returns a Promise of
 * the object with all nested Promises resolved.
 */
export async function valuesForPromises(promises: Array<Promise<object>>): Promise<Array<object>> {
  return Promise.all(promises.map((next: Promise<object>, index: number) => {
    return resolveAtIndex(next, index)
  })).then((values: Array<[object, number]>) => {
    return processValues(values)
  })
}

function processValues(values: Array<PromiseUpdate>): Array<object> {
  return values.sort((a: PromiseUpdate, b: PromiseUpdate) => {
    if (a[1] < b[1]) {
      return -1
    } else {
      return 1
    }
  }).map((next: [object, number]) => {
    return next[0]
  })
}

function resolveAtIndex(promise: Promise<object>, index: number): Promise<PromiseUpdate> {
  return new Promise((resolve, reject) => {
    promise.then((val: object) => {
      return resolve([val, index])
    }, (err: any) => {
      return resolve([{}, index])
    })
  })
}

function appendUpdateForObject(value: any, path: Array<string>, updates: Array<ObjectUpdate>): void {
  if (value instanceof Promise) {
    updates.push([ path, value ])

  } else if (typeof value === 'object') {
    collectUnresolvedPromises(value, path, updates)
  }
}

function collectUnresolvedPromises(
  obj: any,
  path: Array<string> = [],
  updates: Array<ObjectUpdate> = [],
): Array<ObjectUpdate> {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const value = obj[i]
      const newPath: Array<string> = [ ...path, `${i}` ]
      appendUpdateForObject(value, newPath, updates)
    }

    return updates

  } else if (obj instanceof Promise) {
    updates.push([ path, obj ])
    return updates

  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      const newPath: Array<string> = [ ...path, key ]
      appendUpdateForObject(value, newPath, updates)
    }

    return updates

  } else {
    return []
  }
}

async function handleUnresolved(unresolved: Array<ObjectUpdate>, base: object): Promise<object> {
  const paths: Array<string> = unresolved.map((next: ObjectUpdate) => next[0].join('.'))
  const promises: Array<Promise<object>> = unresolved.map((next: ObjectUpdate) => next[1])
  const resolvedPromises: Array<object> = await Promise.all(promises.map((next: Promise<object>) => {
    return next.then((val: object) => {
      const nested: Array<ObjectUpdate> = collectUnresolvedPromises(val)
      if (nested.length > 0) {
        return handleUnresolved(nested, val)
      } else {
        return Promise.resolve(val)
      }
    })
  }))

  const newObj: object = resolvedPromises.reduce((acc: object, next: any, currentIndex: number) => {
    return setValueForKey(paths[currentIndex], next, acc)
  }, base)

  return newObj
}

export async function resolveObjectPromises(obj: object): Promise<any> {
  const unresolved: Array<ObjectUpdate> = collectUnresolvedPromises(obj)
  return handleUnresolved(unresolved, obj)
}
