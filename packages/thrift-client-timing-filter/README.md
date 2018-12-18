# Thrift Client Timing Filter

When using Thrift over HTTP we can use HTTP headers to pass context/metadata between services (tracing, auth). When using TCP we don't have this. Among the options to solve this is to prepend an object onto the head of our TCP payload. `@creditkarma/thrift-client` comes with two filters for helping with this situation.

## Installation

`ThriftClientContextFilter` has a few `peerDependencies`.

```sh
npm install --save @creditkarma/thrift-server-core
npm install --save @creditkarma/thrift-client
npm install --save @creditkarma/thrift-client-context-filter
```

## Usage

This plugin writes a Thrift struct onto the head of an outgoing payload and reads a struct off of the head of an incoming payload.

```typescript
import {
    createTcpClient,
} from '@creditkarma/thrift-client'

import {
    ThriftClientContextFilter,
} from '@creditkarma/thrift-client-context-filter'

import {
    RequestContext,
    ResponseContext,
} from './codegen/metadata'

import {
    Calculator,
} from './codegen/calculator'

const thriftClient: Calculator.Client<RequestContext> =
    createTcpClient(Calculator.Client, {
        hostName: 'localhost',
        port: 8080,
        register: [ ThriftClientContextFilter<RequestContext, ResponseContext>({
            RequestContextClass: RequestContext,
        }) ]
    })

thriftClient.add(5, 6, new RequestContext({ traceId: 3827293 })).then((response: number) => {
    // Do stuff...
})
```

### Options

Available options for ThriftClientContextFilter:

* RequestContextClass (required): A class (extending StructLike) that is to be prepended to outgoing requests.
* ResponseContextClass (optional): A class (extending StructLike) that is prepended to incoming responses. Defaults to nothing.
* transportType (optional): The type of transport to use. Currently only 'buffered'.
* protocolType (optional): The type of protocol to use, either 'binary' or 'compact'.

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
