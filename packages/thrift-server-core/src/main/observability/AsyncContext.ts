import { AsyncScope } from '@creditkarma/async-scope'
import { Context, TraceId } from 'zipkin'

const asyncScope = new AsyncScope()

export class AsyncContext implements Context<TraceId> {
    public setContext(ctx: TraceId): void {
        asyncScope.set('traceId', ctx)
    }

    public getContext(): TraceId {
        return asyncScope.get<TraceId>('traceId')!
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
