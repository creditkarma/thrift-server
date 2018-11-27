import { config } from '@creditkarma/dynamic-config'
import { ZipkinTracingExpress } from '@creditkarma/zipkin-tracing-express'

import { createHttpClient, IRequest } from '@creditkarma/thrift-client'

import { ZipkinClientFilter } from '@creditkarma/zipkin-client-filter'

import * as express from 'express'
import * as path from 'path'

import { Calculator, Operation, Work } from './generated/calculator-service'

async function init(): Promise<void> {
    const SERVER_CONFIG = await config().get('calculator-service')
    const CLIENT_CONFIG = await config().get('client')

    // Get express instance
    const app = express()

    app.use(
        ZipkinTracingExpress({
            localServiceName: 'calculator-client',
            tracerConfig: {
                endpoint: 'http://localhost:9411/api/v1/spans',
                httpInterval: 1000,
                httpTimeout: 5000,
                sampleRate: 1.0,
            },
        }),
    )

    // Create thrift client
    const thriftClient: Calculator.Client<IRequest> = createHttpClient(
        Calculator.Client,
        {
            hostName: SERVER_CONFIG.host,
            port: SERVER_CONFIG.port,
            register: [
                ZipkinClientFilter({
                    localServiceName: 'calculator-client',
                    remoteServiceName: 'calculator-service',
                    tracerConfig: {
                        endpoint: 'http://localhost:9411/api/v1/spans',
                        httpInterval: 1000,
                        httpTimeout: 5000,
                        sampleRate: 1.0,
                    },
                }),
            ],
        },
    )

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

    app.get(
        '/',
        (req: express.Request, res: express.Response): void => {
            res.sendFile(path.join(__dirname, './index.html'))
        },
    )

    app.get(
        '/ping',
        (req: express.Request, res: express.Response): void => {
            thriftClient.ping({ headers: req.headers }).then(
                () => {
                    res.send('success')
                },
                (err: any) => {
                    console.log('err: ', err)
                    res.status(500).send(err)
                },
            )
        },
    )

    app.get(
        '/calculate',
        (req: express.Request, res: express.Response): void => {
            const work: Work = new Work({
                num1: req.query.left,
                num2: req.query.right,
                op: symbolToOperation(req.query.op),
            })

            thriftClient.calculate(1, work, { headers: req.headers }).then(
                (val: number) => {
                    res.send(`result: ${val}`)
                },
                (err: any) => {
                    res.status(500).send(err)
                },
            )
        },
    )

    app.listen(CLIENT_CONFIG.port, () => {
        console.log(
            `Web server listening at http://${CLIENT_CONFIG.host}:${
                CLIENT_CONFIG.port
            }`,
        )
    })
}

init()
