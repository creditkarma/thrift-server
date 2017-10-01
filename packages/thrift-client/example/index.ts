import { fork, exec } from 'child_process'
import { generate } from '@creditkarma/thrift-typescript'

process.chdir(__dirname)

generate({
  rootDir: '.',
  outDir: 'codegen',
  sourceDir: 'thrift',
  files: [ './tutorial.thrift' ]
})

const clientProc = fork('./client.ts')
const serverProc = fork('./server.ts')

function exit(code: number) {
  clientProc.kill()
  serverProc.kill()
  process.exitCode = code
}

setTimeout(() => {
  exec('curl http://localhost:8044/ping', function(err, stout, sterr) {
    console.log('stdout: ', stout)
    if (err != null) {
      console.error('Error running Thrift service: ', err)
      exit(1)
    }

    if (stout === 'success') {
      exec('curl http://localhost:8044/add', function(err, stout, sterr) {
        console.log('stdout: ', stout)
        console.log('Successfully able to run Thrift service')
        exit(0)
      });
    } else {
      console.error(`Unexpected response from Thrift service: ${stout}`)
      exit(1)
    }
  })
}, 5000)