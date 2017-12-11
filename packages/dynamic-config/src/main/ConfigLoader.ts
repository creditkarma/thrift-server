import * as fs from 'fs'
import * as path from 'path'

import {
  CONFIG_SEARCH_PATHS,
  DEFAULT_CONFIG_PATH,
  DEFAULT_ENVIRONMENT,
} from './constants'
import { resolveObjects } from './utils'

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

  public async loadDefault(): Promise<T> {
    return readFile(path.resolve(this.configPath, 'default.json')).then((content: string) => {
      return (parseContent(content) as any)
    }, (err: any) => {
      return {}
    })
  }

  public async loadEnvironment(): Promise<T> {
    return readFile(path.resolve(this.configPath, `${this.configEnv}.json`)).then((content: string) => {
      return (parseContent(content) as any)
    }, (err: any) => {
      return {}
    })
  }

  public async resolve(): Promise<T> {
    if (this.savedConfig !== undefined) {
      return Promise.resolve(this.savedConfig)
    } else {
      const defaultConfig: any = await this.loadDefault()
      const envConfig: any = await this.loadEnvironment()
      this.savedConfig = resolveObjects(defaultConfig, envConfig)
      return this.savedConfig
    }
  }
}
