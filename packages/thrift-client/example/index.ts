import { fork } from 'child_process'
import { generate } from '@creditkarma/thrift-typescript'

process.chdir(__dirname)

generate({
    rootDir: '.',
    outDir: 'generated',
    sourceDir: 'thrift',
    target: 'thrift-server',
    files: [],
})

const clientProc = fork('./client.ts')
const serverProc = fork('./server.ts')

function exit(code: number) {
    clientProc.kill()
    serverProc.kill()
    process.exitCode = code
}

process.on('SIGINT', () => {
    console.log('Caught interrupt signal')
    exit(0)
})
