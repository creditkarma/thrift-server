import { AsyncScope } from '@creditkarma/async-scope'
import { Context, TraceId } from 'zipkin'

export const getAsyncScope: () => AsyncScope = (function() {
    let instance: AsyncScope | undefined
    return function(): AsyncScope {
        if (instance === undefined) {
            instance = new AsyncScope({
                nodeExpiration: 3000,
                purgeInterval: 5000,
            })
        }

        return instance!
    }
}())

export class AsyncContext implements Context<TraceId> {
    public setContext(ctx: TraceId): void {
        getAsyncScope().set('traceId', ctx)
    }

    public getContext(): TraceId {
        return getAsyncScope().get<TraceId>('traceId')!
    }

    public scoped<V>(callable: () => V): V {
        return callable()
    }

    public letContext<V>(ctx: TraceId, callable: () => V): V {
        return this.scoped(() => {
            this.setContext(ctx)
            return callable()
        })
    }
}
