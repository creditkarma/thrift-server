import * as timers from 'timers'
// import { debug } from '../debug'
import { Hooks } from '../Hooks'
import { State } from '../State'

function TimeoutWrap() {}
function IntervalWrap() {}
function ImmediateWrap() {}

const timeoutMap = new Map()
const intervalMap = new Map()
const ImmediateMap = new Map()

let activeCallback: any = null
let clearedInCallback: boolean = false

export function patchTimers(hooks: Hooks, state: State) {
  patchTimer(hooks, state, 'setTimeout', 'clearTimeout', TimeoutWrap, timeoutMap, true)
  patchTimer(hooks, state, 'setInterval', 'clearInterval', IntervalWrap, intervalMap, false)
  patchTimer(hooks, state, 'setImmediate', 'clearImmediate', ImmediateWrap, ImmediateMap, true)

  global.setTimeout = timers.setTimeout
  global.setInterval = timers.setInterval
  global.setImmediate = timers.setImmediate

  global.clearTimeout = timers.clearTimeout
  global.clearInterval = timers.clearInterval
  global.clearImmediate = timers.clearImmediate
}

function patchTimer(
    hooks: Hooks,
    state: State,
    setFn: string,
    clearFn: string,
    Handle: any,
    timerMap: any,
    singleCall: boolean,
): void {
    const oldSetFn = (timers as any)[setFn]
    const oldClearFn = (timers as any)[clearFn];

    // overwrite set[Timeout]
    (timers as any)[setFn] = function() {
        if (!state.enabled) {
            return oldSetFn.apply(timers, arguments)
        }

        const args = Array.from(arguments)
        const callback = args[0]

        if (typeof callback !== 'function') {
            throw new TypeError('"callback" argument must be a function')
        }

        const handle = new Handle()
        const uid = state.nextId += 1
        let timerId: number

        // call the init hook
        hooks.init.call(handle, uid, 0, state.currentId, null)

        // overwrite callback
        args[0] = function() {
            // call the pre hook
            activeCallback = timerId
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
                        // call the post hook
                        hooks.post.call(handle, uid, true)
                        // setInterval won't continue
                        timerMap.delete(timerId)
                        hooks.destroy.call(null, uid)
                    })
                }
            }

            // callback done successfully
            hooks.post.call(handle, uid, false)
            activeCallback = null

            // call the destroy hook if the callback will only be called once
            if (singleCall || clearedInCallback) {
                clearedInCallback = false
                timerMap.delete(timerId)
                hooks.destroy.call(null, uid)
            }
        }

        timerId = oldSetFn.apply(timers, args)
        // Bind the timerId and uid for later use, in case the clear* function is
        // called.
        timerMap.set(timerId, uid)

        return timerId
    };

    // overwrite clear[Timeout]
    (timers as any)[clearFn] = (timerId: number) => {
        // If clear* was called within the timer callback, then delay the destroy
        // event to after the post event has been called.
        if (activeCallback === timerId && timerId !== null) {
            clearedInCallback = true
        } else if (timerMap.has(timerId)) {
            const uid = timerMap.get(timerId)
            timerMap.delete(timerId)
            hooks.destroy.call(null, uid)
        }

        oldClearFn.apply(timers, arguments)
    }
}
