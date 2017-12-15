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

You can also assign a default value in the event that the key cannot be found.

```typescript
import { getConfig } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await getConfig().getWithDefault<string>('hostName', 'localhost')
  const port: number = await getConfig().getWithDefault<number>('port', 8080)
  return new Client(host, port)
}
```

## Local Configs

DynamicConfig supports local config in the form of JSON files, remote configuration stored in Consul and secret config values stored in Vault. The usage of Consul and Vault are optional. If these are not configured only local configuration files will be used.

Local configuration files are stored localally with your application source. Typically at the project root in a directory named `config`. By default the library will also look for configs in `src/config`, `lib/config` and `dist/config`. Alternative config locations can be set.

Currently, DynamicConfig only support confing in form of JSON. Support for JS/TS files will be added.

### Default Configuration

The default config for your app is loaded from the `config/default.json` file. The default configuration is required. The default configuration is the contract between you and your application. You can only use keys that you define in your default config. You can override these values in a variety of ways, but they must follow the schema set by your default configuration file.

Overwriting the default values is done by adding additional files corresponding to the value of `NODE_ENV`. For example if `NODE_ENV = 'development'` then the default configuration will be merged with a file named `config/development.json`. Using this you could have different configuration files for `NODE_ENV = 'test'` or `NODE_ENV = 'production'`.

### Configuration Path

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

## Remote Configs

Remote configuration allows you to deploy configuration independent from your application source. We support Consul as the remote configuration source.

### Consul Configs

Remote configuration from Consul is given a higher priority than local configuration. Values stored in Consul are assumed to be JSON structures that can be deeply merged with local configuration files. As such configuration from Consul is merged on top of local configuration, overwriting local configuration in the resulting config object.

You define what configs to load from Consul through the `CONSUL_KEYS` option. This option can be set when constructing an instance or through an environment variable for the singleton instance. The values loaded with these keys are expected to be valid JSON objects.

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

#### Config Overlay

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

Config objects from all sources are deeply merged.

#### Config Placeholders

You can also callout that a single key is stored in Consul. A config placeholder is a simple object with one required field and one optional field:

```typescript
interface IConfigPlaceholder {
  key: string
  default?: any
}
```

This object can appear in your local config and will callout a point where we need to fetch a value from a remote source. If your local configs have resolved to this:

```json
{
  "database": {
    "username": "root",
    "password": {
      "key": "consul!/service-name/password"
    }
  }
}
```

Here, `consul!` is the important bit that calls out that this should be resolved from Consul. The remaining part of the string is the key we look up in the Consul KV store (`service-name/password`). You can also pass override arguments to Consul and URL parameters attaches to this key. For example to change the datacenter you could use `consul!/service-name/password?dc=dc1`.

The `password` field will be resolved from Consul and the resulting value from Consul will replace the placeholder in the resolved config:

```json
{
  "database": {
    "username": "root",
    "password": "S0m3S3cr3tP@55w0rd"
  }
}
```

You can also set a default value for when Consul is not configured. If Consul fails and there is no default an exception is raised.

```json
{
  "server": {
    "host": {
      "key": "consul!/service-name/host",
      "default": "localhost"
    },
    "port": 8080
  }
}
```

#### Available Options

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
  "mount": "secret",
  "namespace": "",
  "tokenPath": "./tmp/token",
  "requestOptions": {}
}
```

#### Getting a Secret from Vault

Getting a secret from Vault is similar to getting a value from local config or Consul.

Based on the configuration the following code will try to load a secret from `http://localhost:8200/secret/username`.

```typescript
client.getSecretValue<string>('username').then((val: string) => {
  // Do something with secret value
})
```

#### Config Placeholders

Config placeholders can also be used for secret keys. To callout that a key should be fetched from Vault the config placeholder must begin with `vault!`.

```json
{
  "database": {
    "username": "root",
    "password": {
      "key": "vault!/service-name/password"
    }
  }
}
```

Our configured mount is default for Vault `secret`. Given that the password in our config will be resolved to the value loaded from `http://localhost:8200/secret/service-name/password`.

Secret placeholders differ from Consul placeholders in that they do not support default values. If the given key cannot be fetched from Vault an exception will be raised.

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)