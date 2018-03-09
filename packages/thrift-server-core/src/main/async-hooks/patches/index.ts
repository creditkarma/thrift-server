import { patchNextTick } from './next-tick'
import { patchPromise } from './promise'
import { patchTimers } from './timers'
import { Patch } from './types'

export interface IPatchMap {
    [name: string]: Patch
}

export const patches: IPatchMap = {
    nextTick: patchNextTick,
    promise: patchPromise,
    timers: patchTimers,
}
