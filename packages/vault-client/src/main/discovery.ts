import * as fs from 'fs'
import * as path from 'path'
import { IHVConfig } from './types'

const BAD_CHARS: Array<string> = [ '\n', '\r' ]

export function getToken(config: IHVConfig): Promise<string> {
    return new Promise((resolve, reject) => {
        const tokenPath: string = path.resolve(process.cwd(), config.tokenPath)
        fs.readFile(tokenPath, (err: any, data: Buffer) => {
            if (err !== null && err !== undefined) {
                console.warn(`Unable to load Vault token from: ${tokenPath}`)
                reject(err)
            } else {
                resolve(cleanLastChar(data.toString('utf-8')))
            }
        })
    })
}

export function cleanLastChar(token: string): string {
    if (BAD_CHARS.indexOf(token.charAt(token.length - 1)) > -1) {
        return token.substring(0, token.length - 1)
    } else {
        return token
    }
}
