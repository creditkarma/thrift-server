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

export function readFromEnvOrProcess(key: string): string | undefined {
  return readValueFromArgs(key, process.argv) || process.env[key]
}

export function readFirstMatch(...keys: Array<string>): string | undefined {
  if (keys.length === 0) {
    return undefined
  } else {
    const [ head, ...tail ] = keys
    const value: string | undefined = readFromEnvOrProcess(head)
    if (value === undefined) {
      return readFirstMatch(...tail)
    } else {
      return value
    }
  }
}

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
