import { Hooks } from '../Hooks'
import { State } from '../State'

class NextTickWrap {}

export function patchNextTick(hooks: Hooks, state: State) {
    const oldNextTick = process.nextTick
    process.nextTick = function tick() {
        if (!state.enabled) {
            return oldNextTick.apply(process, arguments)
        }

        const args = Array.from(arguments)
        const callback = args[0]

        if (typeof callback !== 'function') {
            throw new TypeError('callback is not a function')
        }

        const handle = new NextTickWrap()
        const uid = state.nextId += 1

        // call the init hook
        hooks.init.call(handle, uid, 0, state.currentId, null)

        // overwrite callback
        args[0] = function() {
            // call the pre hook
            hooks.pre.call(handle, uid)

            let didThrow = true
            try {
                callback.apply(this, arguments)
                didThrow = false
            } finally {
                // If `callback` threw and there is an uncaughtException handler
                // then call the `post` and `destroy` hook after the uncaughtException
                // user handlers have been invoked.
                if (didThrow && process.listenerCount('uncaughtException') > 0) {
                    process.once('uncaughtException', () => {
                        hooks.post.call(handle, uid, true)
                        hooks.destroy.call(null, uid)
                    })
                }
            }

            // callback done successfully
            hooks.post.call(handle, uid, false)
            hooks.destroy.call(null, uid)
        }

        return oldNextTick.apply(process, args)
    }
}
