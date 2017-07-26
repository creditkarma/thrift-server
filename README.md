# thrift-ts-core
Thrift core library in TypeScript

### Installation

```sh
npm i --save @creditkarma/thrift-ts-core
```

## Server API

```typescript
import { createServer, httpServer } from '@creditkarma/thrift-ts-core'

const handler = {
  get: (request: RecommendationsRequest) => {
    // Your service implementation
  }
};
createServer('recommendation-system')
    .network(httpServer, { port: 8080 })
    .services('/', RecommendationSystemService, handler)
    .start()

console.log(`Server listening on port ${port}`);

```

## Client API

```typescript
import { createClient, httpClient } from '@creditkarma/thrift-ts-core'

const client = createClient('thrift-benchmark-proxy', EchoReportService)
                .network(httpClient, { host: 'localhost', port: 8080 })
                .connect()
```
