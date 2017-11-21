# Vault Client

A client for Hashicorp Vault written in TypeScript.

## Install

```sh
$ npm install --save @creditkarma/vault-client
```

## Usage

This library exposes two classes for working with Vault, VaultClient and VaultService. VaultClient provides a slightly higher level of abstraction and a more limited API.

### VaultClient

VaultClient provides two methods: get and set. Both methods return Promises.

VaultClient expects the access token for Vault to be available in a local file. Here we pass the path to that file as an option. The contents of this file will be used to make all requests to Vault.

The namespace option is a string path that will be appended to all keys for both get and set methods.

When a secret is written to Vault the vaule you set will be wrapped in an object of this form:

```typescript
{
  value: value
}
```

When reading from Vault with the get method objects of this form are assumed. If there is no value property an exception will be raised. When performing a get only the value of the value key will be returned. This allows set methods to accept primitive values.

```typescript
import { IHVConfig, VaultClient } from '@creditkarma/vault-client'

const options: IHVConfig = {
  protocol: 'http',
  apiVersion: 'v1',
  destination: 'localhost:8200',
  hostHeader: '',
  namespace: 'secret',
  tokenPath: '/tmp/token',
}
const client: VaultClient = new VaultClient(options)

client.set('key', 'value').then(() => {
  // value successfully written
  client.get<string>('key').then((val: string) => {
    // val = 'value'
  })
})
```

### VaultService

VaultService provides more direct access to the raw Vault HTTP API. Method arguments and method return types conform to the [HTTP Vault API](https://www.vaultproject.io/api/).

Like VaultClient all methods return Promises.

```typescript
import { IServiceConfig, VaultService } from '@creditkarma/vault-client'

const options: IServiceConfig = {
  protocol: 'http',
  apiVersion: 'v1',
  destination: 'localhost:8200',
  hostHeader: '',
}
const service: VaultService = new VaultService(options)

service.status()
service.init({ secret_shares: 1, secret_threshold: 1 })
service.unseal({ key: 'key', reset: true })
service.read(path, token)
service.write(path, value, token)
```

## Running Tests

Running tests requires a running Vault server. You can start one with:

```sh
$ npm run docker
```

This docker image has a little sugar on top of the base Vault image. It exposes an endpoint for retrieving the token.

```sh
$ curl localhost:8201/client-token
```

The tests will use this to make calls to Vault.

In another terminal window you can run tests.

```sh
$ npm test
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)