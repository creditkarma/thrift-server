import * as fs from 'fs'
import * as util from 'util'

/**
 * Using `console.log` causes new AsyncResources to be created, so using `console.log` in
 * the AsyncHooks callbacks will cause infinite stack growth. Using this function for debugging
 * is synchronous and avoids this issue.
 */
export function debug(msg: string, ...args: Array<any>): void {
    fs.writeSync(1, `${util.format(msg, ...args)}\n`)
}
