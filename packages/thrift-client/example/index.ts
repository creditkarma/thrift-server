import { fork } from 'child_process'
import { generate } from '@creditkarma/thrift-typescript'

// process.chdir(__dirname)

generate({
    rootDir: './example',
    outDir: 'generated',
    sourceDir: 'thrift',
    target: 'thrift-server',
    files: [
        './calculator.thrift'
    ]
})

const clientProc = fork('./example/client.ts')
const serverProc = fork('./example/server.ts')

function exit(code: number) {
    clientProc.kill()
    serverProc.kill()
    process.exitCode = code
}

process.on('SIGINT', () => {
    console.log('Caught interrupt signal')
    exit(0)
})
