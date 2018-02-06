import * as fs from 'fs'
import * as ts from 'typescript'
import * as vm from 'vm'
import { IFileLoader } from '../types'

export const tsLoader: IFileLoader = {
    type: 'ts',
    async load(filePath: string): Promise<object> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, content: Buffer) => {
                if (err) {
                    reject(err)
                } else {
                    const source: string = content.toString()
                    const result: ts.TranspileOutput = ts.transpileModule(source, {})
                    const sandbox = { exports: {} }

                    vm.createContext(sandbox)
                    vm.runInContext(result.outputText, sandbox)

                    if ((sandbox.exports as any).default) {
                        resolve((sandbox.exports as any).default)
                    } else {
                        resolve(sandbox.exports)
                    }
                }
            })
        })
    },
}
