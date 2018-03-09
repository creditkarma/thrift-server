// import { debug } from './debug'
import { State } from './State'

import {
    AsyncHook,
} from './AsyncHook'

const asyncWrap: any = (process as any).binding('async_wrap')
const TIMERWRAP: number = asyncWrap.Providers.TIMERWRAP
const ignoreUIDs = new Set()

export class Hooks {
    public hooks: Array<AsyncHook> = []

    public init: (uid: number, provider: any, parentId: number, parentHandle: any) => void
    public pre: (uid: number) => void
    public post: (uid: number, didThrow: boolean) => void
    public destroy: (uid: number) => void

    private state: State

    constructor(state: State) {
        this.state = state

        this.init = (uid: number, provider: any, parentUid: number, parentHandle: any) => {
            // Ignore TIMERWRAP, since setTimeout etc. is monkey patched
            if (provider === TIMERWRAP) {
                ignoreUIDs.add(uid)
                return
            }

            const thisId = (this.state.nextId += 1)
            this.state.idMap.set(uid, thisId)

            // debug(`init: id: ${uid}`)
            // debug(`init: parent: ${parentUid}`)
            // debug(`init: provider: `, provider)
            // debug(`init: handle: `, parentHandle)

            // call hooks
            for (const hook of this.hooks) {
                hook.init(thisId, provider, this.state.currentId, parentHandle)
            }
        }

        this.pre = (uid: number) => {
            this.state.previousIds.push(this.state.currentId)
            this.state.currentId = this.state.idMap.get(uid) || 0
            if (ignoreUIDs.has(uid)) {
                return
            }

            // debug(`pre: id: ${this.state.currentId}`)

            // call hooks
            for (const hook of this.hooks) {
                hook.before(this.state.currentId)
            }
        }

        this.post = (uid: number, didThrow: boolean) => {
            const thisId = this.state.idMap.get(uid) || 0
            this.state.currentId = this.state.previousIds.pop() || 0
            if (ignoreUIDs.has(uid)) { return }

            // debug(`post: id: ${thisId}`)

            // call hooks
            for (const hook of this.hooks) {
                hook.after(thisId)
            }
        }

        this.destroy = (uid: number) => {
            // Cleanup the ignore list if this uid should be ignored
            if (ignoreUIDs.has(uid)) {
                ignoreUIDs.delete(uid)
                return
            }

            if (this.state.idMap.has(uid)) {
                const thisId = this.state.idMap.get(uid) || 0
                this.state.idMap.delete(uid)

                // debug(`destroy: id: ${thisId}`)

                // call hooks
                for (const hook of this.hooks) {
                    hook.destroy(thisId)
                }
            }
        }
    }

    public add(hook: AsyncHook) {
        this.hooks.push(hook)
    }

    public remove(hook: AsyncHook) {
        this.hooks = this.hooks.filter((next: AsyncHook) => next !== hook)
    }
}
