# Dynamic Config

A dynamic configuration library for Node.js written in TypeScript and backed by Hashicorp Consul and Vault.

## Install

```sh
$ npm install @creditkarma/dynamic-config
```

## Usage

The most common usage of DynamicConfig is through a singleton instance. The singleton instance is lazily created through the exported function `getConfig`. Subsequent calls to this method will return the same instance. Configuration can be passed to the function or set on environment variables. We'll see more of that below.

When requesting a value from config a Promise of the expected result is returned. If the value is found the Promise is resolved. If the value is not found, either because it is missing or some other error, the Promise is rejected.

```typescript
import { getConfig } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await getConfig().get<string>('hostName')
  const port: number = await getConfig().get<number>('port')
  return new Client(host, port)
}
```

You can also construct your own instance by importing the underlying DynamicConfig class

```typescript
import { DynamicConfig } from '@creditkarma/dynamic-config'

const config: DynamicConfig = new DynamicConfig()

export async function createHttpClient(): Promise<Client> {
  const host: string = await config.get<string>('hostName')
  const port: number = await config.get<number>('port')
  return new Client(host, port)
}
```

### Sync Config

The reason that all DynamicConfig methods return a Promise is because data is also potentially being pulled from Consul/Vault over HTTP (This is cached after first call). Using async/await syntax can alleviate the awkwardness of dealing with async config. However, we can also choose to pay the price of loading all the configs up front.

```typescript
import { getSyncConfig, SyncConfig } from '@creditkarma/dynamic-config'

getSyncConfig().then((config: SyncConfig) => {
  const host: string = config.get<string>('hostName')
  const port: number = config.get<number>('port')
  const client = new Client(host, port)
})
```

The `SyncConfig` object is identical to the `DynamicConfig` object with the exception that the `get` method doesn't return a Promise.

## Config Resolution

DynamicConfig supports local config in the form of JSON files, remote configuration stored in Consul and secret config values stored in Vault. The usage of Consul and Vault are optional. If these are not configured only local configuration files will be used.

### Local Configs

Local configuration files are stored localally with your application source. Typically at the project root in a directory named `config`.

#### Default Configuration

The default config for your app is loaded from the `config/default.json` file. The default configuration is required. The default configuration is the contract between you and your application. You can only use keys that you define in your default config. You can override these values in a variety of ways, but they must follow the schema set by your default configuration file.

Overwriting the default values is done by adding additional files corresponding to the value of `NODE_ENV`. For example if `NODE_ENV = 'development'` then the default configuration will be merged with a file named `config/development.json`. Using this you could have different configuration files for `NODE_ENV = 'test'` or `NODE_ENV = 'production'`.

#### Configuration Path

The path to the config files is configurable when instantiating the DynamicConfig object. The option can either be an absolute path or a path relative to `process.cwd()`. The option can be defined both when constructing an instance or through an environment variable.

In TypeScript:
```typescript
const dynamicConfig: DynamicConfig = new DynamicConfig({
  configPath: path.resolve(__dirname, './config'),
})
```

Through environment:
```sh
$ export CONFIG_PATH=config
```

### Remote Configs

Remote configuration allows you to deploy configuration independent from your application source. We support Consul as the remote configuration source.

#### Consul Configs

Remote configuration from Consul is given a higher priority than local configuration. Values stored in Consul are assumed to be JSON structures that can be deeply merged with local configuration files. As such configuration from Consul is merged on top of local configuration, overwriting local configuration in the resulting config object.

You define what configs to load from Consul through the `CONSUL_KEYS` option. This option can be set when constructing an instance or through an environment variable for the singleton instance.

In TypeScript:
```typescript
const dynamicConfig: DynamicConfig = new DynamicConfig({
  consulKeys: 'production-config,production-east-config',
})
```

Through environment:
```sh
$ export CONSUL_KEYS=production-config,production-east-config
```

### Available Options

Here are the available options for DynamicConfig:

* `CONSUL_ADDRESS` - Address to Consul agent.
* `CONSUL_KV_DC` - Data center to receive requests.
* `CONSUL_KEYS` - Comma-separated list of keys pointing to configs stored in Consul. They are merged in left -> right order, meaning the rightmost key has highest priority.
* `CONFIG_PATH` - Path to local configuration files.

#### Environment Variables

All options can be set through the environment.

```sh
$ export CONSUL_ADDRESS=http://localhost:8500
$ export CONSUL_KV_DC=dc1
$ export CONSUL_KEYS=production-config,production-east-config
$ export CONFIG_PATH=config
```

#### Constructor Options

They can also be set on the DynamicConfig constructor.

```typescript
const config: DynamicConfig = new DynamicConfig({
  consulAddress: 'http://localhost:8500',
  consulKvDc: 'dc1',
  consulKeys: 'production-config',
  configPath: 'config',
})
```

### Secret Configs

Secret configs, such as database credentials, can be stored in Hashicorp Vault.

#### Hashicorp Vault Configuration

The configuration for Vault needs to be available somewhere in the config path, either in a local config or in Consul. This configuration mush be available under the key name `'hashicorp-vault'`.

If Vault is not configured all calls to get secret config values with error out.

The configuration must conform to what is expected from [@creditkarma/vault-client](https://github.com/creditkarma/thrift-server/tree/dynamic-config/packages/vault-client).

```json
"hashicorp-vault": {
  "apiVersion": "v1",
  "destination": "http://localhost:8200",
  "namespace": "secret",
  "tokenPath": "./tmp/token",
  "requestOptions": {}
}
```

#### Getting a Secret from Vault

Getting a secret from Vault is similar to getting a value from local config or Consul.

```typescript
client.getSecretValue<string>('/secret/username').then((val: string) => {
  // Do something with secret value
})
```

## Config Resolution

If my local config looks like this:

```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  },
  "database": {
    "username": "root",
    "password": "root"
  }
}
```

And the config loaded from Consul looks like this:

```json
{
  "server": {
    "port": 9000
  },
  "database": {
    "password": "test"
  }
}
```

The resulting config my app would use is:

```json
{
  "server": {
    "host": "localhost",
    "port": 9000
  },
  "database": {
    "username": "root",
    "password": "test"
  }
}
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)