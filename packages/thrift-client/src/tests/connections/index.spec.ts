import {
    createClient,
} from '../../main'

import { CoreOptions } from 'request'

import {
    SERVER_CONFIG,
} from '../config'

import {
    readThriftMethod,
} from '../../main/utils'

import * as childProcess from 'child_process'
import { expect } from 'code'
import * as Lab from 'lab'

import {
    Calculator,
    Choice,
    FirstName,
    LastName,
} from '../generated/calculator/calculator'

import {
    SharedStruct,
} from '../generated/shared/shared'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after

describe('createClient', () => {
    let server: childProcess.ChildProcess

    before((done: any) => {
        server = childProcess.fork('./dist/tests/server.js')
        server.on('message', (msg: any) => console.log(msg))
        setTimeout(done, 2000)
    })

    after((done: any) => {
        server.kill('SIGINT')
        setTimeout(done, 1000)
    })

    describe('Basic Usage', () => {
        let client: Calculator.Client<CoreOptions>

        before(async () => {
            client = createClient(Calculator.Client, SERVER_CONFIG)
        })

        it('should corrently handle a service client request', async () => {
            return client.add(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should corrently handle a void service client request', async () => {
            return client.ping()
                .then((response: any) => {
                    expect(response).to.equal(undefined)
                })
        })

        it('should corrently handle a binary data', async () => {
            const word: string = 'test_binary'
            const data: Buffer = Buffer.from(word, 'utf-8')
            return client.echoBinary(data)
                .then((response: string) => {
                    expect(response).to.equal(word)
                })
        })

        it('should corrently handle a string data', async () => {
            const word: string = 'test_string'
            return client.echoString(word)
                .then((response: string) => {
                    expect(response).to.equal(word)
                })
        })

        it('should call an endpoint with union arguments', async () => {
            const firstName: Choice = new Choice({ firstName: new FirstName({ name: 'Louis' })})
            const lastName: Choice = new Choice({ lastName: new LastName({ name: 'Smith' })})

            return Promise.all([
                client.checkName(firstName),
                client.checkName(lastName),
            ]).then((val: string[]) => {
                expect(val[0]).to.equal('FirstName: Louis')
                expect(val[1]).to.equal('LastName: Smith')
            })
        })

        it('should call an endpoint with optional parameters', async () => {
            return Promise.all([
                client.checkOptional('test_first'),
                client.checkOptional(),
            ]).then((val: string[]) => {
                expect(val[0]).to.equal('test_first')
                expect(val[1]).to.equal('undefined')
            })
        })

        it('should corrently handle a service client request that returns a struct', async () => {
            return client.getStruct(5)
                .then((response: SharedStruct) => {
                    expect(response).to.equal(new SharedStruct({ key: 0, value: 'test' }))
                })
        })

        it('should corrently handle a service client request that returns a union', async () => {
            return client.getUnion(1)
                .then((response: any) => {
                    expect(response).to.equal({ option1: 'foo' })
                })
        })

        it('should allow passing of a request context', async () => {
            return client.addWithContext(5, 7, { headers: { 'X-Fake-Token': 'fake-token' } })
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject auth request without context', async () => {
            return client.addWithContext(5, 7)
                .then((response: number) => {
                    expect(false).to.equal(true)
                }, (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                })
        })

        it('should reject for a 500 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                path: '/return500',
            })

            return badClient.add(5, 7)
                .then((response: number) => {
                    throw new Error('Should reject with status 500')
                }, (err: any) => {
                    expect(err.statusCode).to.equal(500)
                })
        })

        it('should reject for a 400 server response', async () => {
            const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                path: '/return400',
            })

            return badClient.add(5, 7)
                .then((response: number) => {
                    throw new Error('Should reject with status 400')
                }, (err: any) => {
                    expect(err.statusCode).to.equal(400)
                })
        })

        it('should reject for a request to a missing service', async () => {
            const badClient: Calculator.Client<CoreOptions> = createClient(Calculator.Client, {
                hostName: 'fakehost',
                port: 8080,
                requestOptions: {
                    timeout: 5000,
                },
            })

            return badClient.add(5, 7)
                .then((response: number) => {
                    throw new Error('Should reject with host not found')
                }, (err: any) => {
                    expect(err).to.exist()
                })
        })
    })

    describe('IncomingMiddleware', () => {
        it('should resolve when middleware allows', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    handler(data: Buffer): Promise<Buffer> {
                        if (readThriftMethod(data) === 'add') {
                            return Promise.resolve(data)
                        } else {
                            return Promise.reject(
                                new Error(`Unrecognized method name: ${readThriftMethod(data)}`),
                            )
                        }
                    },
                }],
            })

            return client.add(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should resolve when middleware passes method filter', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    methods: [ 'add' ],
                    handler(data: Buffer): Promise<Buffer> {
                        if (readThriftMethod(data) === 'add') {
                            return Promise.resolve(data)
                        } else {
                            return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
                        }
                    },
                }],
            })

            return client.add(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject when middleware rejects', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    handler(data: Buffer): Promise<Buffer> {
                        if (readThriftMethod(data) === 'nope') {
                            return Promise.resolve(data)
                        } else {
                            return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
                        }
                    },
                }],
            })

            return client.add(5, 7)
                .then((response: number) => {
                    throw new Error(`Mehtods should fail when middleware rejects`)
                }, (err: any) => {
                    expect(err.message).to.equal('Unrecognized method name: add')
                })
        })

        it('should skip handler when middleware fails method filter', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    methods: [ 'nope' ],
                    handler(data: Buffer): Promise<Buffer> {
                        return Promise.reject(new Error(`Unrecognized method name: ${readThriftMethod(data)}`))
                    },
                }],
            })

            return client.add(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })
    })

    describe('OutgoingMiddleware', () => {
        it('should resolve when middleware adds auth token', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    type: 'outgoing',
                    handler(context: CoreOptions): Promise<CoreOptions> {
                        return Promise.resolve(Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }))
                    },
                }],
            })

            return client.addWithContext(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should resolve when middleware passes method filter', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    type: 'outgoing',
                    methods: [ 'addWithContext' ],
                    handler(context: CoreOptions): Promise<CoreOptions> {
                        return Promise.resolve(Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }))
                    },
                }],
            })

            return client.addWithContext(5, 7)
                .then((response: number) => {
                    expect(response).to.equal(12)
                })
        })

        it('should reject when middleware does not add auth token', async () => {
            const client = createClient(Calculator.Client, SERVER_CONFIG)

            return client.addWithContext(5, 7)
                .then((response: number) => {
                    throw new Error(`Mehtods should fail when middleware rejects`)
                }, (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                })
        })

        it('should resolve when middleware fails method filter', async () => {
            const client = createClient(Calculator.Client, {
                hostName: SERVER_CONFIG.hostName,
                port: SERVER_CONFIG.port,
                register: [{
                    type: 'outgoing',
                    methods: [ 'add' ],
                    handler(context: CoreOptions): Promise<CoreOptions> {
                        return Promise.resolve(Object.assign({}, context, {
                            headers: {
                                'X-Fake-Token': 'fake-token',
                            },
                        }))
                    },
                }],
            })

            return client.addWithContext(5, 7)
                .then((response: number) => {
                    throw new Error(`Mehtods should fail when middleware rejects`)
                }, (err: any) => {
                    expect(err.message).to.equal('Unauthorized')
                })
        })
    })

    after((done: any) => {
        server.kill('SIGINT')
        setTimeout(done, 1000)
    })
})
