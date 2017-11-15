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
