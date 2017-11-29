# Dynamic Config

A dynamic configuration library for Node.js written in TypeScript and backed by Hashicorp Consul and Vault.

## Install

```sh
$ npm install @creditkarma/dynamic-config
```

## Usage

The most common usage of DynamicConfig is through the exported singleton instance. The singleton instance is configured through envirnoment variables. We'll see that later.

When requesting a value from config a Promise of the expected result is returned. If the value is found the Promise is resolved. If the value is not found, either because it is missing or some other error, the Promise is rejected.

```typescript
import { config } from '@creditkarma/dynamic-config'

config.get<string>('config-key').then((configValue: string) => {
  // Do something with config value
})
```

You can also construct your own instance by importing the underlying DynamicConfig class

```typescript
import { DynamicConfig } from '@creditkarma/dynamic-config'

const config: DynamicConfig = new DynamicConfig()

config.get<string>('config-key').then((configValue: string) => {
  // Do something with config value
})
```

## Environment Specific Configuration

DynamicConfig supports local config in the form of JSON files, remote configuration stored in Consul and secret config values stored in Vault. The usage of Consul and Vault are optional. If these are not configured only local configuration files will be used.

### Local Configs

Local configuration files are store localally with your application source. Typically at the project root in a directory named `config`.

#### Default Configuration

The default config for your app is loaded from the `config/default.json` file.

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

Remote configuration from Consul is given a higher priority than local configuration. When requesting a key from DynamicConfig the value will first be returned from Consul and only be returned from local config if it is not available in Consul.

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

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)