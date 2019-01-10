import { IThriftClientFilter } from '../types'

export function filterByMethod<Context>(
    method: string,
): (filter: IThriftClientFilter<Context>) => boolean {
    return (filter: any): boolean => {
        return (
            filter.methods.length === 0 || filter.methods.indexOf(method) > -1
        )
    }
}
