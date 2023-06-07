import merge = require('lodash/merge')
import * as url from 'url'

export * from './appendThriftObject'
export * from './readThriftObject'
export * from './readThriftMetadata'
export * from './normalizePath'

export function deepMerge<Base extends object, Update extends object>(
    base: Base,
    update: Update,
): Base & Update {
    return merge({}, base, update)
}

export function overlayObjects<A, B>(a: A, b: B): A & B
export function overlayObjects<A, B, C>(a: A, b: B, c: C): A & B & C
export function overlayObjects<A, B, C, D>(
    a: A,
    b: B,
    c: C,
    d: D,
): A & B & C & D
export function overlayObjects<A, B, C, D, E>(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
): A & B & B & C & D & E
export function overlayObjects(...objs: Array<any>): any {
    return objs.reduce((acc: any, next: any) => {
        return deepMerge(acc, next)
    }, {})
}

export function formatUrl(requestUrl: string): string {
    const parsed = url.parse(url.format(requestUrl))

    if (!parsed.pathname) {
        return `${parsed.hostname || ''}/`
    } else {
        return `${parsed.hostname || ''}${parsed.pathname}`
    }
}
