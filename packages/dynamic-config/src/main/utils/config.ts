import {
  isNothing,
  isPrimitive,
  splitKey,
} from './basic'

import {
  objectMatchesSchema,
} from './schema'

import {
  BaseConfigValue,
  ConfigValue,
  IConfigPlaceholder,
  IConfigProperties,
  IObjectConfigValue,
  IResolvedPlaceholder,
  IResolverMap,
  IRootConfigValue,
  ObjectType,
} from '../types'

import * as logger from '../logger'

export function readValueForType(raw: string, type: ObjectType): Promise<any> {
  const rawType: string = typeof raw

  if (rawType === 'string') {
    try {
      switch (type) {
        case 'object':
        case 'array':
          return Promise.resolve(JSON.parse(raw))

        case 'number':
          return Promise.resolve(parseFloat(raw))

        case 'boolean':
          return Promise.resolve(raw === 'true')

        default:
          return Promise.resolve(raw)
      }
    } catch (err) {
      logger.error(`Unable to parse value as type[${type}]`)
      return Promise.reject(new Error(`Unable to parse value as type[${type}]`))
    }
  } else {
    logger.log(`Raw value of type[${rawType}] being returned as is`)
    return Promise.resolve(raw)
  }
}

export function normalizeConfigPlaceholder(
  placeholder: IConfigPlaceholder,
  resolvers: IResolverMap,
): IResolvedPlaceholder {
  const source: string = placeholder._source
  const resolver = resolvers.all.get(source)
  if (resolver !== undefined) {
    return {
      key: placeholder._key,
      resolver: {
        name: source,
        type: resolver.type,
      },
      type: (placeholder._type || 'string'),
      default: placeholder._default,
    }
  }

  throw new Error(`No resolver found for remote[${source}]`)
}

export function isValidRemote(name: string, resolvers: Set<string>): boolean {
  return resolvers.has(name)
}

export function isConfigPlaceholder(obj: any): obj is IConfigPlaceholder {
  return objectMatchesSchema({
    type: 'object',
    properties: {
      '_key': {
        type: 'string',
      },
      '_source': {
        type: 'string',
      },
      '_type': {
        type: 'string',
      },
      '_default': {
        type: 'any',
      },
    },
    required: [ '_key', '_source' ],
  }, obj)
}

function setObjectPropertyValue(key: string, value: BaseConfigValue, configObject: BaseConfigValue): BaseConfigValue {
  if (configObject.type === 'object') {
    const what: BaseConfigValue = {
      source: configObject.source,
      resolved: configObject.resolved,
      type: 'object',
      properties: Object.keys(configObject.properties).reduce((acc: IConfigProperties, next: string) => {
        if (next === key) {
          acc[next] = value
        } else {
          acc[next] = configObject.properties[next]
        }
        return acc
      }, {}),
      watchers: configObject.watchers,
    }

    return what

  } else {
    logger.warn(`Cannot set value for key[${key}] on a non-object`)
    return configObject
  }
}

export function setBaseConfigValueForKey(key: string, value: BaseConfigValue, oldValue: BaseConfigValue): BaseConfigValue {
  if (typeof key !== 'string') {
    throw new Error('Property to set must be a string')

  } else if (isNothing(value)) {
    throw new Error(`Cannot set null value for key[${key}]`)

  } else if (isNothing(oldValue)) {
    throw new Error(`Cannot set value on null type at key[${key}]`)

  } else {
    const [ head, ...tail ] = splitKey(key)

    if (tail.length > 0) {
      if (oldValue.type === 'object') {
        return {
          source: oldValue.source,
          resolved: oldValue.resolved,
          type: 'object',
          properties: Object.keys(oldValue.properties).reduce((acc: IConfigProperties, next: string) => {
            if (next === head) {
              acc[next] = setBaseConfigValueForKey(tail.join('.'), value, oldValue.properties[next])
            } else {
              acc[next] = oldValue.properties[next]
            }
            return acc
          }, {}),
          watchers: oldValue.watchers,
        }

      } else {
        throw new Error(`Cannot set value for key[${key}] on a non-object value`)
      }

    } else if (
      oldValue.type === 'object' &&
      oldValue.properties[head] !== undefined
    ) {
      return setObjectPropertyValue(head, value, oldValue)

    } else {
      throw new Error('duh')
    }
  }
}

export function setRootConfigValueForKey(key: string, value: BaseConfigValue, oldConfig: IRootConfigValue): IRootConfigValue {
  if (typeof key !== 'string') {
    throw new Error('Property to set must be a string')

  } else if (isNothing(oldConfig)) {
    throw new Error(`Cannot set value on null type at key: ${key}`)

  } else {
    const newConfig: IRootConfigValue = {
      type: 'root',
      properties: {},
    }
    const [ head, ...tail ] = splitKey(key)
    const props: Array<string> = Object.keys(oldConfig.properties)

    for (const prop of props) {
      if (prop === head) {
        if (tail.length > 0) {
          newConfig.properties[prop] = setBaseConfigValueForKey(tail.join('.'), value, oldConfig.properties[prop])

        } else {
          newConfig.properties[prop] = value
        }

      } else {
        newConfig.properties[prop] = oldConfig.properties[prop]
      }
    }

    return newConfig
  }
}

export function setValueForKey(key: string, value: BaseConfigValue, oldConfig: ConfigValue): ConfigValue {
  if (oldConfig.type === 'root') {
    return setRootConfigValueForKey(key, value, oldConfig)
  } else {
    return setBaseConfigValueForKey(key, value, oldConfig)
  }
}

function buildObjectValue(obj: IObjectConfigValue | IRootConfigValue): any {
  const objectValue: any = {}

  for (const key of Object.keys(obj.properties)) {
    objectValue[key] = readConfigValue(obj.properties[key])
  }

  return objectValue
}

export function readConfigValue(obj: ConfigValue): any {
  switch (obj.type) {
    case 'root':
    case 'object':
      return buildObjectValue(obj)

    case 'array':
      return obj.items

    case 'string':
    case 'number':
    case 'boolean':
      return obj.value

    case 'placeholder':
    logger.warn(`Trying to read value of unresolved Placeholder`)
    return null

    case 'promise':
    logger.warn(`Trying to read value of unresolved Promise`)
    return null

    default:
      return null
  }
}

function getValueFromConfigValue(key: string, obj: ConfigValue): ConfigValue | null {
  if (isPrimitive(obj) || isNothing(obj)) {
    return null

  } else {
    const parts: Array<string> = splitKey(key)

    if (parts.length > 1) {
      const [ head, ...tail ] = parts
      if (obj.type === 'object') {
        return getValueFromConfigValue(tail.join('.'), obj.properties[head])

      } else {
        return null
      }

    } else if (
      obj.type === 'object' &&
      obj.properties[key] !== undefined
    ) {
      return obj.properties[key]

    } else {
      return null
    }
  }
}

export function getConfigForKey(key: string, obj: IRootConfigValue): ConfigValue | null {
  if (isPrimitive(obj) || isNothing(obj)) {
    return null

  } else {
    const parts: Array<string> = splitKey(key)

    if (parts.length > 1) {
      const [ head, ...tail ] = parts
      return getValueFromConfigValue(tail.join('.'), obj.properties[head])

    } else if (obj.properties[parts[0]] !== undefined) {
      return obj.properties[parts[0]]

    } else {
      return null
    }
  }
}
