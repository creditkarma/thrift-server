# thrift-ts-core
Thrift core library in TypeScript

### Installation

```sh
npm i --save @creditkarma/thrift-ts-core
```

## Server API

```typescript
import { createServer, http } from '@creditkarma/thrift-ts-core'

const handler = {
  get: (request: RecommendationsRequest) => {
    // Your service implementation
  }
};
const server = createServer('recommendation-system')
                // `http` will expose a `.server` interface for servers
                .network(http, { port: 8080 })
                .services('/', RecommendationSystemService, handler)

// WIP
server.start().then((port) => console.log(`Server listening on port ${port}`))
```

## Client API

```typescript
import { createClient, http } from '@creditkarma/thrift-ts-core'

const client = createClient('thrift-benchmark-proxy', EchoReportService)
                // `http` will also expose a `.client` interface for clients
                .network(http, { host: 'localhost', port: 8080 })
```
