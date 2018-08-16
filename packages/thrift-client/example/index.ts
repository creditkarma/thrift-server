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
const addProc = fork('./add-service.ts')
const calculatorProc = fork('./calculator-service.ts')

function exit(code: number) {
    clientProc.kill()
    addProc.kill()
    calculatorProc.kill()
    process.exitCode = code
}

process.on('SIGINT', () => {
    console.log('Caught interrupt signal')
    exit(0)
})
