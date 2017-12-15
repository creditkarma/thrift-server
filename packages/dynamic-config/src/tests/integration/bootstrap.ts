#!/usr/bin/env node
import { KvStore } from '@creditkarma/consul-client'
import { VaultClient } from '@creditkarma/vault-client'
import { execSync } from 'child_process'

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

process.chdir(__dirname)

setTimeout(() => {
  const consulClient: KvStore = new KvStore('http://localhost:8510')
  const vaultClient: VaultClient = new VaultClient({
    apiVersion: 'v1',
    destination: 'http://localhost:8210',
    tokenPath: './tmp/token',
  })

  const token: string = execSync('curl http://localhost:8211/client-token').toString()

  function rootDir(): string {
    if (os.platform() === 'win32') {
      return process.cwd().split(path.sep)[0]
    } else {
      return '/'
    }
  }

  function createPath(parts: Array<string>, soFar: string): void {
    const current: string = path.join(soFar, parts[0])
    if (!fs.existsSync(current)) {
      fs.mkdirSync(current)
    }

    if (parts.length > 1) {
      createPath(parts.slice(1), current)
    }
  }

  function mkdir(dirPath: string): void {
    const parts: Array<string> = dirPath.split(path.sep).filter((val: string) => val !== '')

    // Check for absolute path
    if (parts.length > 0 && path.isAbsolute(dirPath)) {
      createPath(parts, rootDir())
    } else if (parts.length > 0) {
      createPath(parts, process.cwd())
    }
  }

  // create directory for test token
  mkdir('./tmp')

  fs.writeFile('./tmp/token', token, (err: any) => {
    Promise.all([
      consulClient.set({ path: 'test-config-one' }, {
        database: {
          username: 'testUser',
          password: 'consul!/password',
        },
      }),
      consulClient.set({ path: 'test-config-two' }, {
        database: {
          username: 'fakeUser',
          password: {
            key: 'consul!/missing-password',
            default: 'NotSoSecret',
          },
        },
      }),
      consulClient.set({ path: 'password' }, 'Sup3rS3cr3t'),
      consulClient.set({ path: 'with-vault' }, {
        database: {
          password: 'vault!/password',
        },
        'hashicorp-vault': {
          apiVersion: 'v1',
          destination: 'http://localhost:8210',
          mount: 'secret',
          tokenPath: './tmp/token',
        },
      }),
      vaultClient.set('/secret/test-secret', 'this is a secret'),
      vaultClient.set('/secret/password', 'K1ndaS3cr3t'),
    ]).then((result: any) => {
      console.log('Done populating mock data')
    }, (failure: any) => {
      console.log('Error populating mock data: ', failure)
    })
  })
}, 2000)
