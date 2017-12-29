import * as fs from 'fs'
import * as path from 'path'

import {
  CONFIG_SEARCH_PATHS,
  DEFAULT_CONFIG_PATH,
  DEFAULT_ENVIRONMENT,
  SUPPORTED_FILE_TYPES,
} from './constants'

import * as utils from './utils'

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

function getConfigPath(sourceDir: string): string {
  const firstPath: string = path.resolve(process.cwd(), sourceDir)
  if (fs.existsSync(firstPath) && fs.statSync(firstPath).isDirectory) {
    return firstPath
  } else {
    for (const next of CONFIG_SEARCH_PATHS) {
      const nextPath: string = path.resolve(process.cwd(), next, sourceDir)
      if (fs.existsSync(nextPath) && fs.statSync(nextPath).isDirectory) {
        return nextPath
      }
    }
  }

  throw new Error('No local config directory found')
}

async function loadFileWithName<T>(configPath: string, name: string): Promise<T> {
  const configs: Array<any> = await utils.valuesForPromises(SUPPORTED_FILE_TYPES.map((ext: string) => {
    const filePath: string = path.resolve(configPath, `${name}.${ext}`)

    return readFile(filePath).then((content: string) => {
      switch (ext) {
        case 'js':
          return require(filePath)

        case 'ts':
          require('ts-node').register({
            lazy: true,
            compilerOptions: {
              allowJs: true,
              rootDir: '.',
            },
          })

          return require(filePath)

        default:
          return (parseContent(content) as any)
      }
    }, (err: any) => {
      return {}
    })
  }))

  return (utils.overlayObjects(...configs) as T)
}

export interface ILoaderConfig {
  configPath?: string
  configEnv?: string
}

export class ConfigLoader<T = any> {
  private configPath: string
  private configEnv: string
  private savedConfig: T

  constructor({ configPath = DEFAULT_CONFIG_PATH, configEnv }: ILoaderConfig = {}) {
    this.configPath = getConfigPath(configPath)
    this.configEnv = configEnv || process.env.NODE_ENV || DEFAULT_ENVIRONMENT
  }

  /**
   * Loads default JSON config file. This is required.
   */
  public async loadDefault(): Promise<T> {
    return loadFileWithName<T>(this.configPath, 'default')
  }

  /**
   * Loads JSON config file based on NODE_ENV.
   */
  public async loadEnvironment(): Promise<T> {
    return loadFileWithName<T>(this.configPath, this.configEnv)
  }

  /**
   * Returns the overlay of the default and environment local config.
   */
  public async resolve(): Promise<T> {
    if (this.savedConfig !== undefined) {
      return Promise.resolve(this.savedConfig)
    } else {
      const defaultConfig: any = await this.loadDefault()
      const envConfig: any = await this.loadEnvironment()
      this.savedConfig = utils.overlayObjects(defaultConfig, envConfig)
      return this.savedConfig
    }
  }
}
