import { IFileLoader } from '../types'

export const tsLoader: IFileLoader = {
  type: 'ts',
  async load(filePath: string): Promise<object> {
    require('ts-node').register({
      lazy: true,
      cache: false,
      typeCheck: true,
      compilerOptions: {
        allowJs: true,
        rootDir: '.',
      },
    })

    const configObj = require(filePath)

    if (typeof configObj.default === 'object') {
      return configObj.default
    } else {
      return configObj
    }
  },
}
