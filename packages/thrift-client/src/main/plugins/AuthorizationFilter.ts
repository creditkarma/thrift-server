import { CoreOptions } from 'request'
import {
    IRequest,
    IRequestResponse,
    IThriftClientFilter,
    IThriftContext,
    NextFunction,
} from '../types'

const AUTHORIZATION_HEADER: string = 'Authorization'

export function AuthorizationFilter<Context extends IRequest>(): IThriftClientFilter<Context> {
    return {
        methods: [],
        handler(data: Buffer, context: IThriftContext<Context>, next: NextFunction<CoreOptions>): Promise<IRequestResponse> {
            if (
                context.request &&
                context.request.headers &&
                context.request.headers.authorization !== undefined
            ) {
                return next(data, {
                    headers: {
                        [AUTHORIZATION_HEADER]: context.request.headers.authorization,
                    },
                })

            } else {
                return next()
            }
        },
    }
}
