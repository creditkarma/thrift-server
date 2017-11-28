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

#### Options

VaultClient expects the access token for Vault to be available in a local file. The path to this file is passed as an option.

Available options:
* apiVersion - API version to use. Currently this can only be 'v1'.
* destination - The location of the Vault instance. Defaults to 'http://localhost:8200'.
* namespace - A namespace for secrets. This path will be prepended to all get/set requests. Defaults to ''.
* tokenPath - The local file path to a file containing the Vault token. Defaults to '/tmp/token'.
* requestOptions - Options passed to the underlying [Request library](https://github.com/request/request). The options can be overriden on a per-request basis by passing an optional final parameter to any of the service or client methods. This will be used to set up TLS.

#### Data Formatting

When a secret is written to Vault the value you set will be wrapped in an object of this form:

```typescript
{
  "value": value
}
```

When reading values with VaultClient objects of this form are assumed. If there is no value property an exception will be raised. When performing a get only the value of the value key will be returned. This allows get and set methods to operate on primitive values.

#### Example

```typescript
import { IHVConfig, VaultClient } from '@creditkarma/vault-client'

const options: IHVConfig = {
  apiVersion: 'v1',
  destination: 'http://localhost:8200',
  namespace: 'secret',
  tokenPath: '/tmp/token',
  requestOptions: {
    headers: {
      host: 'localhost'
    }
  }
}
const client: VaultClient = new VaultClient(options)

// Because we set a namespace this is actually written to 'secret/key'
client.set('key', 'value').then(() => {
  // value successfully written
  client.get<string>('key').then((val: string) => {
    // val = 'value'
  })
})
```

### VaultService

VaultService provides more direct access to the raw Vault HTTP API. Method arguments and method return types conform to the [HTTP Vault API](https://www.vaultproject.io/api/).

#### Options

VaultService accepts a sub-set of the options that VaultClient accepts:
* apiVersion
* destination
* requestOptions

#### Example

Like VaultClient all methods return Promises.

```typescript
import { IServiceConfig, VaultService } from '@creditkarma/vault-client'

const options: IServiceConfig = {
  apiVersion: 'v1',
  destination: 'http://localhost:8200',
  requestOptions: {
    headers: {
      host: 'localhost'
    }
  }
}
const service: VaultService = new VaultService(options)

service.status()
service.init({ secret_shares: 1, secret_threshold: 1 })
service.unseal({ key: 'key', reset: true })
service.read(path, token)
service.write(path, value, token)
```

## Running Tests

The good ol' `npm test` will work. However, running tests requires a running Vault server. This is done with [docker](https://www.docker.com/). If you don't have `docker-compose` on your system you will be unable to run tests. Make sure you have docker.

```sh
$ npm test
```

You can spin up the Vault server without running tests:

```sh
$ npm run docker
```

This docker image has a little sugar on top of the base Vault image. It exposes an endpoint for retrieving the token.

```sh
$ curl localhost:8201/client-token
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)