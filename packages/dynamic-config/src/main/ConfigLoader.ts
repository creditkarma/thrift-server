import * as fs from 'fs'
import * as path from 'path'

import {
  CONFIG_SEARCH_PATHS,
  DEFAULT_CONFIG_PATH,
  DEFAULT_ENVIRONMENT,
} from './constants'
import { resolveConfigs } from './resolve'
import { IConfigMap } from './types'

function readDir(dir: string): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err: any, files: Array<string>) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

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

function getConfigPath(sourcePaths: Array<string> = []): string {
  const firstPath: string = path.resolve(process.cwd(), DEFAULT_CONFIG_PATH)
  if (fs.existsSync(firstPath) && fs.statSync(firstPath).isDirectory) {
    return DEFAULT_CONFIG_PATH
  } else {
    for (const next of CONFIG_SEARCH_PATHS) {
      const nextPath: string = path.resolve(process.cwd(), next, DEFAULT_CONFIG_PATH)
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

  constructor({ configPath = getConfigPath(), configEnv = '' }: ILoaderConfig = {}) {
    this.configPath = configPath
    this.configEnv = configEnv || process.env.NODE_ENV || DEFAULT_ENVIRONMENT
  }

  public async load(): Promise<Array<[string, object]>> {
    return readDir(path.resolve(process.cwd(), this.configPath)).then((filePaths: Array<string>) => {
      return Promise.all(filePaths.filter((filePath: string) => {
        return path.extname(filePath) === '.json'
      }).map((filePath: string) => {
        return readFile(path.resolve(process.cwd(), this.configPath, filePath)).then((content: string) => {
          return parseContent(content).then((val: object): [ string, object ] => {
            return [ path.basename(filePath, '.json'), val ]
          })
        })
      }))
    })
  }

  public async loadConfigMap(): Promise<IConfigMap> {
    return this.load().then((configs: Array<[string, object]>) => {
      return configs.reduce((acc: IConfigMap, next: [ string, object ]) => {
        acc[next[0]] = next[1]
        return acc
      }, {} as IConfigMap)
    })
  }

  public async resolve(): Promise<T> {
    if (this.savedConfig !== undefined) {
      return Promise.resolve(this.savedConfig)
    } else {
      return this.loadConfigMap().then((configs: IConfigMap): T => {
        const defaultConfig: any = configs.default || {}
        const envConfig: any = configs[this.configEnv] || {}
        this.savedConfig = resolveConfigs(defaultConfig, envConfig)
        return (this.savedConfig)
      })
    }
  }
}
