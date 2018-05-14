import { config } from '@creditkarma/dynamic-config'
import {

} from '@creditkarma/thrift-server-express'

import {
    createHttpClient,
} from '../src/main/'

import * as path from 'path'
import { CoreOptions } from 'request'
import * as express from 'express'

import {
    Work,
    Operation,
    Calculator,
} from './generated/calculator/calculator'

(async function() {
    const SERVER_CONFIG = await config().get('server')
    const CLIENT_CONFIG = await config().get('client')

    // Get express instance
    const app = express()

    // Create thrift client
    const thriftClient: Calculator.Client<CoreOptions> = createHttpClient(Calculator.Client, {
        hostName: SERVER_CONFIG.host,
        port: SERVER_CONFIG.port,
    })

    function symbolToOperation(sym: string): Operation {
        switch (sym) {
            case 'add':
                return Operation.ADD
            case 'subtract':
                return Operation.SUBTRACT
            case 'multiply':
                return Operation.MULTIPLY
            case 'divide':
                return Operation.DIVIDE
            default:
                throw new Error(`Unrecognized operation: ${sym}`)
        }
    }

    app.get('/', (req: express.Request, res: express.Response): void => {
        res.sendFile(path.join(__dirname, './index.html'))
    })

    app.get('/ping', (req: express.Request, res: express.Response): void => {
        thriftClient.ping().then(() => {
            res.send('success')
        }, (err: any) => {
            console.log('err: ', err)
            res.status(500).send(err)
        })
    })

    app.get('/calculate', (req: express.Request, res: express.Response): void => {
        const work: Work = new Work({
            num1: req.query.left,
            num2: req.query.right,
            op: symbolToOperation(req.query.op)
        })

        thriftClient.calculate(1, work).then((val: number) => {
            res.send(`result: ${val}`)
        }, (err: any) => {
            res.status(500).send(err)
        })
    })

    app.listen(CLIENT_CONFIG.port, () => {
        console.log(`Web server listening at http://${CLIENT_CONFIG.host}:${CLIENT_CONFIG.port}`)
    })
}())
