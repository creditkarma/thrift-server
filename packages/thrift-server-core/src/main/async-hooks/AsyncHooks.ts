import { AsyncHook } from './AsyncHook'
import { Hooks } from './Hooks'
import { patches } from './patches'
import { State } from './State'
import { IAsyncHook, IHookCallbacks } from './types'
const asyncWrap: any = (process as any).binding('async_wrap')

const state = new State()
const hooks = new Hooks(state)

export const version: number = require('../../../package.json').version

for (const key of Object.keys(patches)) {
    patches[key](hooks, state)
}

asyncWrap.setupHooks({
    init: hooks.init,
    pre: hooks.pre,
    post: hooks.post,
    destroy: hooks.destroy,
})

asyncWrap.enable()

export function createHook(callbacks: IHookCallbacks): IAsyncHook {
    const hook: AsyncHook = new AsyncHook(callbacks)
    hooks.add(hook)
    return hook
}

export function executionAsyncId(): number {
    return state.currentId
}

export function triggerAsyncId(): number {
    return state.parentId
}

// export class AsyncHooks {
//     public version: number
//     private state: State
//     private hooks: Hooks
//     // private providers: any

//     constructor() {
//         this.state = new State()
//         this.hooks = new Hooks(this.state)

//         // expose version for conflict detection
//         this.version = require('../../../package.json').version

//         // expose the Providers map
//         // this.providers = asyncWrap.Providers

//         // apply patches
//         for (const key of Object.keys(patches)) {
//             patches[key](this.hooks, this.state)
//         }

//         // setup async wrap
//         // if (!process.env.hasOwnProperty('NODE_ASYNC_HOOK_NO_WARNING')) {
//         //     console.error('warning: you are using async-hook which is unstable.')
//         // }

//         asyncWrap.setupHooks({
//             init: this.hooks.init,
//             pre: this.hooks.pre,
//             post: this.hooks.post,
//             destroy: this.hooks.destroy,
//         })

//         asyncWrap.enable()
//     }

//     public addHooks(hooks: any) {
//         this.hooks.add(hooks)
//     }

//     public removeHooks(hooks: any) {
//         this.hooks.remove(hooks)
//     }

//     public enable() {
//         this.state.enabled = true
//         // asyncWrap.enable();
//     }

//     public disable() {
//         this.state.enabled = false
//         asyncWrap.disable()
//     }

//     public executionAsyncId(): number {
//         return this.state.currentId
//     }
// }
