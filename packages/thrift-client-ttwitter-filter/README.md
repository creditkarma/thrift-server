# ThriftClientTTwitterFilter

This plugin can be used in conjuction with Twitter's open source [Finagle](https://github.com/twitter/finagle) project to add and receive the headers that project expects.

## Installation

`ThriftClientTTwitterFilter` has a few `peerDependencies`.

```sh
npm install --save @creditkarma/thrift-server-core
npm install --save @creditkarma/thrift-client
npm install --save @creditkarma/thrift-client-context-filter
npm install --save @creditkarma/thrift-client-ttwitter-filter
```

## Usage

```typescript
import {
    createTcpClient,
} from '@creditkarma/thrift-client'

import {
    ThriftClientTTwitterFilter,
} from '@creditkarma/thrift-client-ttwitter-filter'

import {
    Calculator,
} from './codegen/calculator'

const thriftClient: Calculator.Client<RequestContext> =
    createTcpClient(Calculator.Client, {
        hostName: 'localhost',
        port: 8080,
        register: [ ThriftClientTTwitterFilter({
            localServiceName: 'calculator-client',
            remoteServiceName: 'calculator-service',
            destHeader: 'calculator-service',
            endpoint: 'http://localhost:9411/api/v1/spans',
            sampleRate: 1,
        }) ]
    })

thriftClient.add(5, 6).then((response: number) => {
    // Do stuff...
})
```

*Note: The Twitter types are generated and exported under the name `TTwitter`*

## Options

Available options for ThriftClientTTwitterFilter:

* localServiceName (required): The name of your local service/application.
* remoteServiceName (required): The name of the remote service you are calling.
* destHeader (optional): A name for the destination added to the RequestHeader object Finagle expects. Defaults to the value of `remoteServiceName`.
* isUpgraded (optional): Is the service using TTwitter context. Defaults to true.
* clientId (optional): A unique identifier for the client. Defaults to undefined.
* transportType (optional): The type of transport to use. Currently only 'buffered'.
* protocolType (optional): The type of protocol to use. Currently only 'binary'.
* tracerConfig.debug (optional): Zipkin debug mode. Defaults to false.
* tracerConfig.endpoint (optional): Zipkin endpoint. Defaults to ''.
* tracerConfig.sampleRate (optional): Zipkin samplerate. Defaults to 0.1.
* tracerConfig.httpInterval (optional): Rate (in milliseconds) at which to send traces to Zipkin collector. Defaults to 1000.

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
