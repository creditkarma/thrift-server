export function isPrimitiveType(type: string): type is 'string' | 'number' | 'boolean' {
  return (
    type === 'number' ||
    type === 'string' ||
    type === 'boolean'
  )
}

export function isPrimitive(obj: any): obj is (string | number | boolean) {
  return isPrimitiveType(typeof obj)
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
    !Array.isArray(obj) &&
    typeof obj === 'object'
  )
}

export function splitKey(key: string): Array<string> {
  return (key || '').split('.').filter((val) => {
    return val.trim() !== ''
  })
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
