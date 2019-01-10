import * as url from 'url'

export * from './appendThriftObject'
export * from './readThriftObject'
export * from './readThriftMetadata'
export * from './normalizePath'

function isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object'
}

export function deepMerge<Base, Update>(
    base: Base,
    update: Update,
): Base & Update {
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

    return newObj as Base & Update
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
