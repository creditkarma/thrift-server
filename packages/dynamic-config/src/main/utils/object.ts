import {
    objectAsSimpleSchema,
    objectMatchesSchema,
} from './schema'

import {
    isNothing,
    isObject,
    isPrimitive,
    splitKey,
} from './basic'

import {
    ISchema,
} from '../types'

export function getValueForKey<T>(key: string, obj: any): T | null {
    if (isPrimitive(obj) || isNothing(obj)) {
        return null

    } else {
        const parts: Array<string> = splitKey(key)

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

    } else if (key === '') {
        return value

    } else {
        const newObj: any = (Array.isArray(oldObj)) ? [] : {}
        const [ head, ...tail ] = splitKey(key)

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

function max(...nums: Array<number>): number {
    return nums.reduce((acc: number, next: number): number => {
        if (next > acc) {
            return next
        } else {
            return acc
        }
    })
}

export function overlayArrays<T>(base: Array<T>, update: Array<T>): Array<T> {
    const newArray: Array<any> = []
    const baseLen: number = base.length
    const updateLen: number = update.length
    const len: number = max(baseLen, updateLen)

    for (let i = 0; i < len; i++) {
        const baseValue = base[i]
        const updateValue = update[i]

        if (Array.isArray(baseValue) && Array.isArray(updateValue)) {
            newArray[i] = overlayArrays(baseValue, updateValue)

        } else if (isObject(baseValue) && isObject(updateValue)) {
            newArray[i] = overlay(baseValue, updateValue)

        } else if (updateValue !== undefined) {
            newArray[i] = updateValue

        } else {
            newArray[i] = baseValue
        }
    }

    return newArray
}

export function overlay<Base, Update>(base: Base, update: Update): Base & Update {
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

            if (Array.isArray(baseValue) && Array.isArray(updateValue)) {
                newObj[key] = overlayArrays(baseValue, updateValue)

            } else if (isObject(baseValue) && isObject(updateValue)) {
                newObj[key] = overlay(baseValue, updateValue)

            } else if (updateValue !== undefined) {
                newObj[key] = updateValue

            } else {
                newObj[key] = baseValue
            }
        }
    }

    return newObj
}

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
