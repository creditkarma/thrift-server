import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import * as vm from 'vm'
import * as logger from '../logger'
import { IFileLoader } from '../types'

function locateFile(basePath: string, searchPath: string): string {
    const resolvedPath: string = path.resolve(path.dirname(basePath), searchPath)
    if (fs.existsSync(`${resolvedPath}.ts`)) {
        return `${resolvedPath}.ts`
    } else {
        return `${resolvedPath}.js`
    }
}

function loadTypeScript(filePath: string): any {
    try {
        const contents: Buffer = fs.readFileSync(filePath)
        const source: string = contents.toString()
        const result: ts.TranspileOutput = ts.transpileModule(source, {})
        const sandbox = {
            exports: {},
            require(pathToRequire: string) {
                if (pathToRequire.startsWith('.') || pathToRequire.startsWith('/')) {
                    const resolvedFile: string = locateFile(filePath, pathToRequire)

                    // If the file to include ends in `ts` use our custom machinery to load file
                    if (path.extname(resolvedFile) === '.ts') {
                        return loadTypeScript(resolvedFile)

                    // Else use the default node system, resolving to absolute path to account for our
                    // shenanigans
                    } else {
                        return require(resolvedFile)
                    }
                } else {
                    return require(pathToRequire)
                }
            },
        }

        vm.createContext(sandbox)

        vm.runInContext(result.outputText, sandbox , {
            displayErrors: true,
        })

        if ((sandbox.exports as any).default) {
            return (sandbox.exports as any).default
        } else {
            return sandbox.exports
        }
    } catch (err) {
        logger.error(`Error parsing typescript config[${filePath}]: `, err)
        return {}
    }
}

export const tsLoader: IFileLoader = {
    type: 'ts',
    async load(filePath: string): Promise<object> {
        return Promise.resolve(loadTypeScript(filePath))
    },
}
