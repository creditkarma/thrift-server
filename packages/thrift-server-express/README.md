# Thrift Server Express

Express middleware for processing Thrift requests.

## Usage

The easiest way to get started is to generate your thrift services using @creditkarma/thrift-typescript.

```sh
npm install --save-dev @creditkarma/thrift-typescript
```

Add a script to your package.json to codegen. The 'target' option is important to make thrift-typescript generate for this library instead of the Apache libraries.

```json
"scripts": {
  "codegen": "thrift-typescript --target thrift-server --sourceDir thrift --outDir codegen
}
```

### Install

```sh
npm install --save express
npm install --save thrift
npm install --save @creditkarma/thrift-server-express
```

### Use the Plugin

To get things working you need to register the middleware as you would any other express middleware. An important thing to note is the use of bodyParse.raw(). This is required, Thrift must operate on the raw binary Buffers.

```typescript
import * as bodyParser from 'body-parser'
import * as express from 'express'
import { thriftExpress } from '../main'

import {
  Calculator,
} from './codegen/calculator'

/**
 * Implementation of our thrift service.
 *
 * Notice the optional final parameter, "context" - this is the Hapi request object,
 * passed along to our service by the Hapi thrift plugin. Thus, you have access to
 * all HTTP request data from within your service implementation.
 */
const serviceHandlers: Calculator.IHandler<express.Request> = {
  add(left: number, right: number, context?: express.Request): number {
    return left + right
  },
  subtract(left: number, right: number, context?: express.Request): number {
    return left - right
  },
}

const PORT = 8090

const app = express()

app.use(
  '/thrift',
  bodyParser.raw(),
  thriftExpress(Calculator.Processor, serviceHandlers),
)

app.get('/control', (req: express.Request, res: express.Response) => {
  res.send('PASS')
})

app.listen(PORT, () => {
  console.log(`Express server listening on port: ${PORT}`)
})
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
