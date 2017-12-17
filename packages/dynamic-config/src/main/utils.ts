import {
  ConfigPlaceholder,
  IConfigPlaceholder,
  IObjectSchema,
  ISchema,
  ObjectUpdate,
} from './types'

import {
  Just,
  Maybe,
  Nothing,
} from './Maybe'

export function isPrimitive(obj: any): boolean {
  return (
    typeof obj === 'number' ||
    typeof obj === 'string' ||
    typeof obj === 'boolean'
  )
}

export function isNothing(obj: any): boolean {
  return (
    obj === null ||
    obj === undefined
  )
}

export function isObject(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object'
  )
}

export function dashToCamel(str: string): string {
  const parts: Array<string> = str.split('-')
  if (parts.length > 1) {
    const base: string = parts.map((part: string) => {
      return part.charAt(0).toUpperCase() + part.substring(1).toLocaleLowerCase()
    }).join('')

    return base.charAt(0).toLocaleLowerCase() + base.substring(1)
  } else {
    return str
  }
}

export function getValueForKey<T>(key: string, obj: any): T | null {
  if (isPrimitive(obj) || isNothing(obj)) {
    return null

  } else {
    const parts = (key || '').split('.').filter((val) => {
      return val.trim() !== ''
    })

    if (parts.length > 1) {
      const [ head, ...tail ] = parts
      const sub: any = obj[head]

      if (!isPrimitive(sub)) {
        return getValueForKey<T>(tail.join('.'), sub)

      } else {
        return null
      }

    } else if (obj[parts[0]] !== undefined) {
      return obj[parts[0]]

    } else {
      return null
    }
  }
}

export function setValueForKey<T>(key: string, value: any, oldObj: any): T {
  if (typeof key !== 'string') {
    throw new Error('Property to set must be a string')

  } else if (oldObj === null) {
    throw new Error(`Cannot set value on null type at key: ${key}`)

  } else {
    const newObj: any = (Array.isArray(oldObj)) ? [] : {}
    const [ head, ...tail ] = (key || '').split('.').filter((val: string) => {
      return val.trim() !== ''
    })

    const props: Array<string> = Object.keys(oldObj)

    for (const prop of props) {
      if (prop === head) {
        if (tail.length > 0) {
          const nextObj = oldObj[prop] || {}
          newObj[prop] = setValueForKey(tail.join('.'), value, nextObj)
        } else {
          newObj[prop] = value
        }

      } else {
        newObj[prop] = oldObj[prop]
      }
    }

    return newObj
  }
}

/**
 * Only copies properties from update into base if they already were defined in base
 */
export function overlay<Base>(base: Base, update: Partial<Base>): Base {
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
        newObj[key] = overlay(baseValue, updateValue)

      } else if (updateValue !== undefined) {
        newObj[key] = updateValue

      } else {
        newObj[key] = baseValue
      }
    }
  }

  return (newObj as Base)
}

export function overlayObjects<A, B, C, D, E>(one: A, two: B, three: C, four: D, five: E): A & B & C & D & E
export function overlayObjects<A, B, C, D>(one: A, two: B, three: C, four: D): A & B & C & D
export function overlayObjects<A, B, C>(one: A, two: B, three: C): A & B & C
export function overlayObjects<A, B>(one: A, two: B): A & B
export function overlayObjects<A>(one: A): A
export function overlayObjects(): {}
export function overlayObjects(...configs: Array<any>): any {
  return configs.reduce((acc: any, next: any) => {
    return overlay(acc, next)
  }, {})
}

export function arraysAreEqual(arr1: Array<any>, arr2: Array<any>): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return arr1 === arr2
  }

  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    const item1: any = arr1[i]
    const item2: any = arr2[i]

    if (Array.isArray(item1) && Array.isArray(item2)) {
      if (!arraysAreEqual(item1, item2)) {
        return false
      }

    } else if (isObject(item1) && isObject(item2)) {
      if (!objectsAreEqual(item1, item2)) {
        return false
      }

    } else if (item1 !== item2) {
      return false
    }
  }

  return true
}

export function findSchemaForKey(schema: ISchema, key: string): Maybe<ISchema> {
  const [ head, ...tail ]: Array<string> =
    key.split('.').filter((next: string) => next.trim() !== '')

  if (tail.length > 0 && schema.type === 'object' && schema.properties[head] !== undefined) {
    return findSchemaForKey(schema.properties[head], tail.join('.'))

  } else if (schema.type === 'object' && schema.properties[head] !== undefined) {
    return new Just(schema.properties[head])

  } else {
    return new Nothing()
  }
}

export function objectAsSimpleSchema(obj: any): ISchema {
  if (Array.isArray(obj)) {
    return {
      type: 'array',
      items: objectAsSimpleSchema(obj[0]),
    }

  } else if (typeof obj === 'object') {
    const schema: IObjectSchema = {
      type: 'object',
      properties: {},
      required: [],
    }

    if (obj !== null) {
      for (const key of Object.keys(obj)) {
        schema.properties[key] = objectAsSimpleSchema(obj[key])
        if (schema.required !== undefined) {
          schema.required.push(key)
        }
      }
    }

    return schema

  } else {
    const objType = typeof obj
    if (objType !== 'function' && objType !== 'symbol') {
      return {
        type: objType,
      } as ISchema

    } else {
      throw new Error(`Type ${objType} cannot be encoded to JSON`)
    }
  }
}

export function objectsAreEqual(obj1: any, obj2: any): boolean {
  if (!isObject(obj1) || !isObject(obj2)) {
    return obj1 === obj2
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (!arraysAreEqual(keys1, keys2)) {
    return false
  }

  for (const key of keys1) {
    const value1: any = obj1[key]
    const value2: any = obj2[key]

    if (isObject(value1) && isObject(value2)) {
      if (!objectsAreEqual(value1, value2)) {
        return false
      }

    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      if (!arraysAreEqual(value1, value2)) {
        return false
      }

    } else if (value1 !== value2) {
      return false
    }
  }

  return true
}

export function objectMatchesSchema(schema: ISchema, obj: any): boolean {
  if (Array.isArray(obj) && schema.type === 'array') {
    return objectMatchesSchema(schema.items, obj[0])

  } else if (typeof obj === 'object' && schema.type === 'object') {
    const schemaKeys: Array<string> = Object.keys(schema.properties)

    if (obj === null) {
      return schemaKeys.length === 0

    } else {
      const objKeys: Array<string> = Object.keys(obj)
      for (const key of objKeys) {
        if (schemaKeys.indexOf(key) === -1) {
          return false
        }
      }

      for (const key of schemaKeys) {
        const nextSchema: ISchema = schema.properties[key]
        const nextObj: any = obj[key]
        if (nextObj === undefined && schema.required !== undefined) {
          return schema.required.indexOf(key) === -1

        } else if (!objectMatchesSchema(nextSchema, nextObj)) {
          return false
        }
      }

      return true
    }

  } else if (schema.type === 'any' || schema.type === typeof obj) {
    return true

  } else {
    return false
  }
}

export function objectHasShape(shape: object, obj: object): boolean
export function objectHasShape(shape: object): (obj: object) => boolean
export function objectHasShape(...args: Array<any>): any {
  const targetSchema: ISchema = objectAsSimpleSchema(args[0])
  if (args.length === 2) {
    return objectMatchesSchema(targetSchema, args[1])
  } else {
    return (obj: object): boolean => {
      return objectMatchesSchema(targetSchema, obj)
    }
  }
}

function isConfigPlaceholder(obj: any): obj is IConfigPlaceholder {
  return objectMatchesSchema({
    type: 'object',
    properties: {
      default: {
        type: 'any',
      },
      key: {
        type: 'string',
      },
    },
    required: [ 'key' ],
  }, obj)
}

export function isConsulKey(obj: any): obj is ConfigPlaceholder {
  return (
    (
      typeof obj === 'string' &&
      obj.startsWith('consul!')
    ) ||
    (
      isConfigPlaceholder(obj) &&
      obj.key.startsWith('consul!')
    )
  )
}

export function isSecretKey(obj: any): obj is ConfigPlaceholder {
  return (
    (
      typeof obj === 'string' &&
      obj.startsWith('vault!')
    ) ||
    (
      isConfigPlaceholder(obj) &&
      obj.key.startsWith('vault!')
    )
  )
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

export async function resolveObjectPromises(obj: object): Promise<object> {
  const unresolved: Array<ObjectUpdate> = collectUnresolvedPromises(obj)
  const paths: Array<string> = unresolved.map((next: ObjectUpdate) => next[0].join('.'))
  const promises: Array<Promise<any>> = unresolved.map((next: ObjectUpdate) => next[1])
  const resolvedPromises: Array<any> = await Promise.all(promises)
  const newObj: object = resolvedPromises.reduce((acc: object, next: any, currentIndex: number) => {
    return setValueForKey(paths[currentIndex], next, acc)
  }, obj)

  return newObj
}
