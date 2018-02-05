import { expect } from 'code'
import * as Lab from 'lab'

import {
    IRootConfigValue,
} from '../../../main'

import {
    ConfigBuilder,
} from '../../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('ConfigBuilder', () => {
    describe('createConfigObject', () => {
        it('should build config for object', async () => {
            const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
                'test',
                'local',
                {
                    protocol: 'https',
                    destination: '127.0.0.1:9000',
                    hostHeader: 'hvault.com',
                    sslValidation: false,
                    namespace: '/your-group/your-service',
                    tokenPath: '/tmp/test-token',
                },
            )

            const expected: IRootConfigValue = {
                type: 'root',
                properties: {
                    protocol: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'string',
                        value: 'https',
                        watchers: [],
                    },
                    destination: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'string',
                        value: '127.0.0.1:9000',
                        watchers: [],
                    },
                    hostHeader: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'string',
                        value: 'hvault.com',
                        watchers: [],
                    },
                    sslValidation: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'boolean',
                        value: false,
                        watchers: [],
                    },
                    namespace: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'string',
                        value: '/your-group/your-service',
                        watchers: [],
                    },
                    tokenPath: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'string',
                        value: '/tmp/test-token',
                        watchers: [],
                    },
                },
            }

            expect(actual).to.equal(expected)
        })

        it('should build config with nested keys', async () => {
            const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
                'test',
                'local',
                {
                    server: {
                        host: 'localhost',
                        port: 8080,
                    },
                },
            )

            const expected: IRootConfigValue = {
                type: 'root',
                properties: {
                    server: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'object',
                        properties: {
                            host: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'string',
                                value: 'localhost',
                                watchers: [],
                            },
                            port: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'number',
                                value: 8080,
                                watchers: [],
                            },
                        },
                        watchers: [],
                    },
                },
            }

            expect(actual).to.equal(expected)
        })

        it('should build config with promised values', async () => {
            const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
                'test',
                'local',
                {
                    server: {
                        host: Promise.resolve('localhost'),
                        port: Promise.resolve(8080),
                    },
                },
            )

            const expected: IRootConfigValue = {
                type: 'root',
                properties: {
                    server: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'object',
                        properties: {
                            host: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'promise',
                                value: Promise.resolve('localhost'),
                                watchers: [],
                            },
                            port: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'promise',
                                value: Promise.resolve(8080),
                                watchers: [],
                            },
                        },
                        watchers: [],
                    },
                },
            }

            expect(actual).to.equal(expected)
        })

        it('should build config with placeholder values', async () => {
            const actual: IRootConfigValue = ConfigBuilder.createConfigObject(
                'test',
                'local',
                {
                    server: {
                        host: {
                            _source: 'consul',
                            _key: 'host-name',
                        },
                        port: {
                            _source: 'consul',
                            _key: 'port-number',
                            _default: 8080,
                        },
                    },
                },
            )

            const expected: IRootConfigValue = {
                type: 'root',
                properties: {
                    server: {
                        source: {
                            type: 'local',
                            name: 'test',
                        },
                        type: 'object',
                        properties: {
                            host: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'placeholder',
                                value: {
                                    _source: 'consul',
                                    _key: 'host-name',
                                },
                                watchers: [],
                            },
                            port: {
                                source: {
                                    type: 'local',
                                    name: 'test',
                                },
                                type: 'placeholder',
                                value: {
                                    _source: 'consul',
                                    _key: 'port-number',
                                    _default: 8080,
                                },
                                watchers: [],
                            },
                        },
                        watchers: [],
                    },
                },
            }

            expect(actual).to.equal(expected)
        })

        it('should throw if config value is not an object', async () => {
            expect(() => {
                ConfigBuilder.createConfigObject('test', 'local', 5)
            }).to.throw()
        })
    })
})
