import * as fs from 'fs'
import { IHVConfig } from './types'

const BAD_CHARS: Array<string> = [ '\n', '\r' ]

export function getToken(config: IHVConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(config.tokenPath, (err: any, data: Buffer) => {
      if (err !== null && err !== undefined) {
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
