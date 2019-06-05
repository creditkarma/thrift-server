import { IRequestContext } from '@creditkarma/thrift-server-core'

import { IThriftClientFilter } from '../types'

export function filterByMethod<
    Context extends IRequestContext = IRequestContext
>(method: string): (filter: IThriftClientFilter<Context>) => boolean {
    return (filter: any): boolean => {
        return (
            filter.methods.length === 0 || filter.methods.indexOf(method) > -1
        )
    }
}
