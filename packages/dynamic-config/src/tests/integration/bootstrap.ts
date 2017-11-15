#!/usr/bin/env node
import { KvStore } from '@creditkarma/consul-client'
import { IHVConfig, VaultClient } from '@creditkarma/vault-client'
import { execSync } from 'child_process'
import * as fs from 'fs'

const consulClient: KvStore = new KvStore()
const vaultClient: VaultClient = new VaultClient({
  apiVersion: 'v1',
  destination: 'http://localhost:8200',
  namespace: 'secret',
  tokenPath: './tmp/token',
})

const token: string = execSync('curl localhost:8201/client-token').toString()

fs.writeFile('./tmp/token', token, (err: any) => {
  Promise.all([
    consulClient.set({ path: 'test' }, {
      database: {
        username: 'testUser',
        password: 'testPass',
      },
    }),
    vaultClient.set('', ''),
  ]).then(() => {
    console.log('done')
  })
})
