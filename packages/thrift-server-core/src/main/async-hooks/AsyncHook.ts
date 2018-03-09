import { IAsyncHook, IHookCallbacks } from './types'

export class AsyncHook implements IAsyncHook {
    private enabled: boolean = false
    private callbacks: IHookCallbacks

    constructor(callbacks: IHookCallbacks) {
        this.callbacks = callbacks
    }

    public init(asyncId: number, type: string, triggerAsyncId: number, resource: object): void {
        if (this.enabled && this.callbacks.init) {
            this.callbacks.init(asyncId, type, triggerAsyncId, resource)
        }
    }

    public before(asyncId: number): void {
        if (this.enabled && this.callbacks.before) {
            this.callbacks.before(asyncId)
        }
    }

    public after(asyncId: number): void {
        if (this.enabled && this.callbacks.after) {
            this.callbacks.after(asyncId)
        }
    }

    public destroy(asyncId: number): void {
        if (this.enabled && this.callbacks.destroy) {
            this.callbacks.destroy(asyncId)
        }
    }

    public enable(): this {
        this.enabled = true
        return this
    }

    public disable(): this {
        this.enabled = false
        return this
    }
}
