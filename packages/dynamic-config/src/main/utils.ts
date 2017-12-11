import {
  ISchema,
} from './types'

function isPrimitive(obj: any): boolean {
  return (
    typeof obj === 'number' ||
    typeof obj === 'string' ||
    typeof obj === 'boolean'
  )
}

function isNothing(obj: any): boolean {
  return (
    obj === null ||
    obj === undefined
  )
}

function isObject(obj: any): boolean {
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

export function getValueForKey<T>(key: string, json: any): T | null {
  if (isPrimitive(json) || isNothing(json)) {
    return null

  } else {
    const parts = (key || '').split('.').filter((val) => {
      return val.trim() !== ''
    })

    if (parts.length > 1) {
      const [ head, ...tail ] = parts
      const sub: any = json[head]

      return (
        !isPrimitive(sub) ?
          getValueForKey<T>(tail.join('.'), sub) :
          null
      )
    } else {
      return (
        json[parts[0]] !== undefined ?
          json[parts[0]] :
          null
      )
    }
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

export function resolveObjects<A, B, C, D, E>(one: A, two: B, three: C, four: D, five: E): A & B & C & D & E
export function resolveObjects<A, B, C, D>(one: A, two: B, three: C, four: D): A & B & C & D
export function resolveObjects<A, B, C>(one: A, two: B, three: C): A & B & C
export function resolveObjects<A, B>(one: A, two: B): A & B
export function resolveObjects<A>(one: A): A
export function resolveObjects(): {}
export function resolveObjects(...configs: Array<any>): any {
  return configs.reduce((acc: any, next: any) => {
    return overlay(acc, next)
  }, {})
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

export function findSchemaForKey(schema: ISchema, key: string): ISchema {
  const [ head, ...tail ]: Array<string> =
    key.split('.').filter((next: string) => next.trim() !== '')

  if (tail.length > 0) {
    if (schema.properties !== undefined) {
      if (schema.properties[head] !== undefined) {
        return findSchemaForKey(schema.properties[head], tail.join('.'))
      }
    }

  } else if (schema.properties !== undefined) {
    if (schema.properties[head] !== undefined) {
      return schema.properties[head]
    }
  }

  throw new Error(`No schema for: ${head}`)
}

export function objectAsSimpleSchema(obj: any): ISchema {
  const schema: ISchema = { type: 'object' }

  if (Array.isArray(obj)) {
    schema.type = 'array'
    schema.items = objectAsSimpleSchema(obj[0])

  } else if (isObject(obj)) {
    schema.type = 'object'
    schema.properties = {}
    for (const key of Object.keys(obj)) {
      schema.properties[key] = objectAsSimpleSchema(obj[key])
    }

  } else if (obj === null) {
    schema.type = 'object'
    schema.properties = {}

  } else {
    const objType = typeof obj
    if (objType !== 'function' && objType !== 'symbol') {
      schema.type = objType

    } else {
      throw new Error(`Type ${objType} cannot be encoded to JSON`)
    }
  }

  return schema
}

export function objectHasShape(shape: object, obj: object): boolean
export function objectHasShape(shape: object): (obj: object) => boolean
export function objectHasShape(...args: Array<any>): any {
  const targetSchema: ISchema = objectAsSimpleSchema(args[0])
  if (args.length === 2) {
    const testSchema: ISchema = objectAsSimpleSchema(args[1])
    return objectsAreEqual(targetSchema, testSchema)
  } else {
    return (obj: object): boolean => {
      const testSchema: ISchema = objectAsSimpleSchema(obj)
      return objectsAreEqual(targetSchema, testSchema)
    }
  }
}
