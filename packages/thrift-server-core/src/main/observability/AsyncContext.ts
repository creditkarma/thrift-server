import { AsyncScope, IAsyncOptions } from '@creditkarma/async-scope'
import { Context, TraceId } from 'zipkin'

export const getAsyncScope: (options: IAsyncOptions) => AsyncScope = (() => {
    let instance: AsyncScope | undefined
    return (options: IAsyncOptions): AsyncScope => {
        if (instance === undefined) {
            instance = new AsyncScope({
                nodeExpiration: (options.nodeExpiration || 800),
                purgeInterval: (options.purgeInterval || 3000),
                maxSize: (options.maxSize || 3000),
            })
        }

        return instance!
    }
})()

export interface IAsyncContext extends Context<TraceId> {
    getValue<T>(key: string): T | null
    setValue<T>(key: string, val: T): void
}

export class AsyncContext implements IAsyncContext {
    private options: IAsyncOptions
    private scope: AsyncScope

    constructor(options: IAsyncOptions) {
        this.options = options
        this.scope = getAsyncScope(this.options)
    }

    public getValue<T>(key: string): T | null {
        return this.scope.get<T>(key)
    }

    public setValue<T>(key: string, val: T): void {
        return this.scope.set(key, val)
    }

    public getScope(): AsyncScope {
        return this.scope
    }

    public setContext(ctx: TraceId): void {
        this.scope.set('traceId', ctx)
    }

    public getContext(): TraceId {
        return this.scope.get<TraceId>('traceId')!
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
