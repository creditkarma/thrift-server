import {
  isObject,
  isPrimitiveType,
} from './basic'

import {
  BaseConfigValue,
  IConfigProperties,
  IRootConfigValue,
  SourceType,
} from '../types'

import * as ConfigUtils from './config'

export function buildBaseConfigValue(sourceName: string, sourceType: SourceType, obj: any): BaseConfigValue {
  const objType = typeof obj
  if (obj instanceof Promise) {
    return {
      source: {
        type: sourceType,
        name: sourceName,
      },
      resolved: false,
      type: 'promise',
      value: obj,
      watchers: [],
    }

  } else if (ConfigUtils.isConfigPlaceholder(obj)) {
    return {
      source: {
        type: sourceType,
        name: sourceName,
      },
      resolved: false,
      type: 'placeholder',
      value: obj,
      watchers: [],
    }

  } else if (Array.isArray(obj)) {
    return {
      source: {
        type: sourceType,
        name: sourceName,
      },
      resolved: true,
      type: 'array',
      items: obj,
      watchers: [],
    }

  } else if (isObject(obj)) {
    return {
      source: {
        type: sourceType,
        name: sourceName,
      },
      resolved: true,
      type: 'object',
      properties: Object.keys(obj).reduce((acc: IConfigProperties, next: string) => {
        acc[next] = buildBaseConfigValue(sourceName, sourceType, obj[next])
        return acc
      }, {}),
      watchers: [],
    }

  } else if (isPrimitiveType(objType)) {
    return {
      source: {
        type: sourceType,
        name: sourceName,
      },
      resolved: true,
      type: objType,
      value: obj,
      watchers: [],
    }

  } else {
    throw new TypeError(`Cannot build config from with object of type[${objType}]`)
  }
}

export function createConfigObject(
  sourceName: string,
  sourceType: SourceType,
  obj: any,
): IRootConfigValue {
  if (isObject(obj)) {
    const configObj: IRootConfigValue = {
      type: 'root',
      properties: {},
    }

    for (const key of Object.keys(obj)) {
      configObj.properties[key] = buildBaseConfigValue(sourceName, sourceType, obj[key])
    }

    return configObj

  } else {
    throw new TypeError(`Config value must be an object, instead found type[${typeof obj}]`)
  }
}
