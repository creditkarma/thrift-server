import { IAsyncHooks } from './types'
import { packageExists } from './utils'

let instance: IAsyncHooks

// If a another copy (same version or not) of stack-chain exists it will result
// in wrong stack traces (most likely dublicate callSites).
if ((global as any)._asyncHook !== undefined) {
    // In case the version match, we can simply return the first initialized copy
    if ((global as any)._asyncHook.version === require('./package.json').version) {
        instance = (global as any)._asyncHook

    } else {
        throw new Error('Conflicting version of async-hook found')
    }

} else if (packageExists('async_hooks')) {
    instance = require('async_hooks')

} else {
    const stackChain: any = require('stack-chain')

    // Remove callSites from this module. AsyncWrap doesn't have any callSites
    // and the hooks are expected to be completely transparent.
    stackChain.filter.attach((error: any, frames: any) => {
        return frames.filter((callSite: any) => {
            const filename = callSite.getFileName()
            // filename is not always a string, for example in case of eval it is
            // undefined. So check if the filename is defined.
            return !(filename && filename.slice(0, __dirname.length) === __dirname)
        })
    })

    instance = require('./AsyncHooks');

    (global as any)._asyncHook = instance!
}

export * from './debug'
export * from './types'
export const asyncHooks = instance
