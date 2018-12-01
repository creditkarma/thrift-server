import { LogFunction, makeLogger } from '@creditkarma/thrift-server-core'

export const defaultLogger: LogFunction = makeLogger(
    'thrift-client-timing-filter',
)
