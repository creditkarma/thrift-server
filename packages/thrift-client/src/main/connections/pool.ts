import * as GenericPool from 'generic-pool'
import * as logger from '../logger'
import {
    Connection,
    createConnection,
    IConnectionConfig,
} from './Connection'

const defaultOptions: GenericPool.Options = {
    min: 0,
    max: 10,
    evictionRunIntervalMillis: 10000,
    idleTimeoutMillis: 10000,
    acquireTimeoutMillis: 1000,
    testOnBorrow: true,
}

export const createPool = (config: IConnectionConfig, options?: GenericPool.Options) => {
    const resolvedOptions = Object.assign(defaultOptions, options)
    const factory: GenericPool.Factory<Connection> = {
        create: async () => {
            logger.log('Creating new client connection')
            return await createConnection(config)
        },
        destroy: async (connection) => {
            logger.log('Destroying client connection')
            return connection.destroy().then(() => undefined)
        },
        validate: async (connection) => {
            return connection.hasSession()
        },
    }

    return GenericPool.createPool(factory, resolvedOptions)
}
