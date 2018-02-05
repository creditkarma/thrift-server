import * as fs from 'fs'
import { IFileLoader } from '../types'

function readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err: any, data: Buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve(data.toString('utf-8'))
            }
        })
    })
}

// Should we fail if one file fails?
function parseContent<T>(content: string): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(content))
        } catch (e) {
            reject(e)
        }
    })
}

export const jsonLoader: IFileLoader = {
    type: 'json',
    async load(filePath: string): Promise<object> {
        return readFile(filePath).then((content: string) => {
            return parseContent(content)
        })
    },
}
