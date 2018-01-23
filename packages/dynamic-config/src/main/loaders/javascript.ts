import { IFileLoader } from '../types'

export const jsLoader: IFileLoader = {
  type: 'js',
  async load(filePath: string): Promise<object> {
    const configObj = require(filePath)

    if (typeof configObj.default === 'object') {
      return configObj.default
    } else {
      return configObj
    }
  },
}
