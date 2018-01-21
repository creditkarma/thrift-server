# Consul Client

A client for Hashicorp Consul written in TypeScript.

This client currently only supports the [Consul KV API](https://www.consul.io/api/kv.html).

## Install

```sh
$ npm install --save @creditkarma/consul-client
```

## K/V Store

The K/V store provides a simple JS API for getting values in and out of Consul. This API is primarily exposed through the KvStore class.

```typescript
import { KvStore, IKey } from '@creditkarma/consul-client'

// Instantiate KvStore with location of Consul, default is localhost:8500
const kvStore: KvStore = new KvStore('http://localhost:8500')
```

### IKey

The KvStore reads, writes and deletes values with Consul based on `IKey` objects. These are objects with one required property and one optional property. The required property is `path`. The path is the key name to look up. The optional property is `dc`. The dc is the datacenter to read from. Per the Consul docs this will default to the datacenter of the agent being queried, specified by the host address.

```typescript
kvStore.set({ path: 'key', dc: 'dc1' }, 'test').then((success: boolean) => {
  if (success) {
    // write was successful
  }
})

kvStore.get({ path: 'key', dc: 'dc1' }).then((val: string) => {
  // val === 'test'
})

kvStore.delete({ path: 'key', dc: 'dc1' }).then((success: boolean) => {
  if (success) {
    // delete was successful
  }
})
```

### Request Options

We use [Request](https://github.com/request/request) as our underlying HTTP client. As such you can pass options through to Request to customize the HTTP request for your environment. This can be done both when instantiating a new KvStore or when making a request.

```typescript
const kvStore: KvStore = new KvStore('http://localhost:8500', { headers: { ... } })

kvStore.get({ path: 'key' }, { headers: { ... } })
```

The options given to the KvStore constructor are used on every request. Options given to a method are only used for that request. Options passed to a request method are deep merged with the instance options before performing the request.

Available [Options](https://github.com/request/request#requestoptions-callback)

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)