import { Hooks } from '../Hooks'
import { State } from '../State'

class PromiseWrap {}

export function patchPromise(hooks: Hooks, state: State) {
    const Promise = global.Promise

    /* As per ECMAScript 2015, .catch must be implemented by calling .then, as
    * such we need needn't patch .catch as well. see:
    * http://www.ecma-international.org/ecma-262/6.0/#sec-promise.prototype.catch
    */
    const oldThen = Promise.prototype.then
    Promise.prototype.then = wrappedThen

    function makeWrappedHandler(fn: any, handle: any, uid: number, isOnFulfilled: boolean) {
        if ('function' !== typeof fn) {
            return isOnFulfilled
                ? makeUnhandledResolutionHandler(uid)
                : makeUnhandledRejectionHandler(uid)
        }

        return function wrappedHandler<T>(this: Promise<T>) {
            hooks.pre.call(handle, uid)
            try {
                return fn.apply(this, arguments)
            } finally {
                hooks.post.call(handle, uid, false)
                hooks.destroy.call(null, uid)
            }
        }
    }

    function makeUnhandledResolutionHandler(uid: number) {
        return function unhandledResolutionHandler(val: any) {
            hooks.destroy.call(null, uid)
            return val
        }
    }

    function makeUnhandledRejectionHandler(uid: number) {
        return function unhandledRejectedHandler(val: any) {
            hooks.destroy.call(null, uid)
            throw val
        }
    }

    function wrappedThen<T>(this: Promise<T>, onFulfilled: any, onRejected: any) {
        if (!state.enabled) {
            return oldThen.call(this, onFulfilled, onRejected)
        }

        const handle = new PromiseWrap()
        const uid = state.nextId += 1

        hooks.init.call(handle, uid, 0, state.currentId, null)

        return oldThen.call(
            this,
            makeWrappedHandler(onFulfilled, handle, uid, true),
            makeWrappedHandler(onRejected, handle, uid, false),
        )
    }
}
