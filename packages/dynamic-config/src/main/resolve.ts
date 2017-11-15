import { deepMerge } from './utils'

export function resolveConfigs<A, B, C, D, E>(one: A, two: B, three: C, four: D, five: E): A & B & C & D & E
export function resolveConfigs<A, B, C, D>(one: A, two: B, three: C, four: D): A & B & C & D
export function resolveConfigs<A, B, C>(one: A, two: B, three: C): A & B & C
export function resolveConfigs<A, B>(one: A, two: B): A & B
export function resolveConfigs<A>(one: A): A
export function resolveConfigs(): {}
export function resolveConfigs(...configs: Array<any>): any {
  return configs.reduce((acc: any, next: any) => {
    return deepMerge(acc, next)
  }, {})
}
