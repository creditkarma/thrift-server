import { ZipkinTracingExpress } from '@creditkarma/zipkin-tracing-express'

import { createHttpClient, IRequest } from '@creditkarma/thrift-client'

import { ThriftClientZipkinFilter } from '@creditkarma/thrift-client-zipkin-filter'

import { ThriftClientTimingFilter } from '@creditkarma/thrift-client-timing-filter'

import * as express from 'express'
import * as net from 'net'

import {
    Calculator,
    IWorkArgs,
    Operation,
    Work,
} from '../generated/calculator-service'

import { ProtocolType } from '@creditkarma/thrift-server-core'
import { CLIENT_CONFIG, HAPI_CALC_SERVER_CONFIG } from '../config'

export function createClientServer(
    sampleRate: number = 0,
    protocolType: ProtocolType = 'binary',
): Promise<net.Server> {
    // Get express instance
    const app = express()

    if (sampleRate > 0) {
        app.use([
            ZipkinTracingExpress({
                localServiceName: 'calculator-client',
                tracerConfig: {
                    endpoint: process.env.ZIPKIN_ENDPOINT,
                    zipkinVersion:
                        process.env.ZIPKIN_VERSION === 'v2' ? 'v2' : 'v1',
                    sampleRate,
                    httpInterval: 0,
                },
            }),
        ])
    }

    // Create thrift client
    const thriftClient: Calculator.Client<IRequest> = createHttpClient(
        Calculator.Client,
        {
            hostName: HAPI_CALC_SERVER_CONFIG.hostName,
            port: HAPI_CALC_SERVER_CONFIG.port,
            protocol: protocolType,
            register:
                sampleRate > 0
                    ? [
                          ThriftClientZipkinFilter({
                              localServiceName: 'calculator-client',
                              remoteServiceName: 'calculator-service',
                              tracerConfig: {
                                  endpoint: process.env.ZIPKIN_ENDPOINT,
                                  zipkinVersion:
                                      process.env.ZIPKIN_VERSION === 'v2'
                                          ? 'v2'
                                          : 'v1',
                                  sampleRate,
                                  httpInterval: 0,
                              },
                          }),
                          ThriftClientTimingFilter({
                              remoteServiceName: 'calculator-service',
                          }),
                      ]
                    : [
                          ThriftClientTimingFilter({
                              remoteServiceName: 'calculator-service',
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
            const work: IWorkArgs = {
                num1: req.query.left,
                num2: req.query.right,
                op: symbolToOperation(req.query.op),
            }

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

    app.get(
        '/calculate-overwrite',
        (req: express.Request, res: express.Response): void => {
            const work: Work = new Work({
                num1: req.query.left,
                num2: req.query.right,
                op: symbolToOperation(req.query.op),
            })

            thriftClient
                .calculate(1, work, {
                    headers: {
                        'x-b3-traceid': '411d1802c9151ded',
                        'x-b3-spanid': 'c3ba1a6560ca0c48',
                        'x-b3-parentspanid': '2b5189ffa013ad73',
                        'x-b3-sampled': '1',
                    },
                })
                .then(
                    (val: number) => {
                        res.send(`result: ${val}`)
                    },
                    (err: any) => {
                        res.status(500).send(err)
                    },
                )
        },
    )

    return new Promise((resolve, reject) => {
        const server: net.Server = app.listen(CLIENT_CONFIG.port, () => {
            console.log(`Web server listening on port[${CLIENT_CONFIG.port}]`)
            resolve(server)
        })
    })
}
