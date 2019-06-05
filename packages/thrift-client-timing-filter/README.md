# Thrift Client Timing Filter

The timing filter is for emitting logs about the usage of a specific client. The filter will emit logs at a sepcified interval. The metric event emitted will tell you the longest request duration over the interval, the average duration of request over the interval and how many successes and errors the client recieved.

## Installation

`ThriftClientTimingFilter` has a few `peerDependencies`.

```sh
npm install --save @creditkarma/thrift-server-core
npm install --save @creditkarma/thrift-client
npm install --save @creditkarma/thrift-client-timing-filter
```

## Usage

```typescript
import {
    createHttpClient,
} from '@creditkarma/thrift-client'

import {
    ThriftClientTimingFilter,
    ITimingEvent,
} from '@creditkarma/thrift-client-timing-filter'

import {
    Calculator,
} from './codegen/calculator'

const thriftClient: Calculator.Client<RequestContext> =
    createHttpClient(Calculator.Client, {
        hostName: 'localhost',
        port: 8080,
        register: [
            ThriftClientTimingFilter({
                remoteServiceName: 'calculator-service',
                interval: 5000,
                logger: (tags: Array<string>, event: ITimingEvent) {
                    console.log('client metrics: ', event)
                },
                tags: [],
            })
        ]
    })

thriftClient.add(5, 6, new RequestContext({ traceId: 3827293 })).then((response: number) => {
    // Do stuff...
})
```

### Options

Available options for `ThriftClientTimingFilter`:

* remoteServiceName (required): Name of the remote service this client connects to.
* interval (optional): How often to emit events in milliseconds. Defaults to 5000.
* logger (optional): A function to log the events. Defaults to a logger using `console.log`.
* tags (optional): An array of strings to attach as tags to the emitted event. Defaults to empty array.

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
