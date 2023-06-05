export const MAX_64_BIT_INTEGER = 9_223_372_036_854_775_807n
export const MIN_64_BIT_INTEGER = -9_223_372_036_854_775_808n

export function assertBigIntRange(num: bigint): void {
    if (num > MAX_64_BIT_INTEGER || num < MIN_64_BIT_INTEGER) {
        throw new Error(`BigInt is outside the 64 bit range`)
    }
}
