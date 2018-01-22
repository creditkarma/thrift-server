# Dynamic Config

A dynamic configuration library for Node.js written in TypeScript.

Dynamic Config supports local config in the form of JSON, JavaScript or TypeScript files. It also supports pulling configs from remote sources through a simple public API. By default remote configuration is stored in Consul and secret config values are stored in Vault. The use of remote configuration is optional. If these are not configurated only local config will be used. At least one local configuration file (`default.(json|js|ts)`) is required.

## Install

```sh
$ npm install @creditkarma/dynamic-config
```

## Usage

The most common usage of Dynamic Config is through a singleton instance. The singleton instance is lazily created through the exported function `config`. Subsequent calls to this function will return the same instance. Configuration can be passed to the function or set on environment variables. We'll see more of that below.

### Promise-based

When requesting a value from Dynamic Config a Promise of the expected result is returned. If the value is found the Promise is resolved. If the value is not found, either because it is missing or some other error, the Promise is rejected.

#### Singleton

The singleton instance registers resolvers for Consul and Vault. We'll see more documentation for these default implementations below.

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await config().get<string>('hostName')
  const port: number = await config().get<number>('port')
  return new Client(host, port)
}
```

#### Class Constructor

You can also construct your own instance by importing the underlying `DynamicConfig` class. The underlying class has no remote resolvers registered. Out-of-the-box it will only pull from local files.

```typescript
import { DynamicConfig } from '@creditkarma/dynamic-config'

const config: DynamicConfig = new DynamicConfig()

export async function createHttpClient(): Promise<Client> {
  const host: string = await config.get<string>('hostName')
  const port: number = await config.get<number>('port')
  return new Client(host, port)
}
```

##### Options

Available options for the `DynamicConfig` constructor are:

```typescript
interface IConfigOptions {
  configPath?: string
  configEnv?: string
  remoteOptions?: IRemoteOptions
  resolvers?: Array<ConfigResolver>
}
```

* configPath - Path to local configuration files. Defaults to '.'.
* configEnv - Override for `NODE_ENV`. Defaults to 'development'.
* remoteOptions - Options to pass to remote resolvers (more on this later).
* resolvers - Resolvers to register on this instance (more on this later).

#### Methods

The availabe methods on a config instance are as follows:

##### `get`

Gets the value for a specified key. If the key cannot be found the Promise is rejected with an `Error` describing what went wrong.

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await config().get<string>('hostName')
  const port: number = await config().get<number>('port')
  return new Client(host, port)
}
```

##### `getWithDefault`

You can also assign a default value in the event that the key cannot be found.

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await config().getWithDefault<string>('hostName', 'localhost')
  const port: number = await config().getWithDefault<number>('port', 8080)
  return new Client(host, port)
}
```

##### `getAll`

Additionally, you can batch get config values. The promise here will only resolve if all of the keys can be retrieved.

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const [ host, port ] = await config().getAll('hostName', 'port')
  return new Client(host, port)
}
```

## Local Configs

Local configuration files are stored localally with your application source, typically at the project root in a directory named `config`. By default the library will also look for configs in `src/config`, `lib/config`, `app/config` and `dist/config`. The config path can be set as an option if you do not wish to use the default resolution.

### Default Configuration

The default config for your app is loaded from the `config/default.(json|js|ts)` file. The default configuration is required. The default configuration is the contract between you and your application. If there is both a `default.json` file and a `default.js` file the values from the `default.js` file will have presidence.

### File Types

The three different file types are loaded in a predictable order. This means that if you have multiple files with the same base name but different extensions (`default.json` vs `default.ts`) the two files have different presidence based on their extension. JSON files are merged first, then JS and finally TS. This means that `ts` files have the highest presidence as their values are merged last.

#### TypeScript

Using TS files is convinient for co-locating your configs with the TypeScript interfaces for those configs.

#### Exporting Values from TypeScript and JavaScript

When exporting config values from a `ts` or `js` file you can either use named or default exports.

Named exports:

```typescript
export const server = {
  hostName: 'localhost',
  port: 8080,
}

export const database = {
  username: 'root',
  password: 'root',
}
```

Default exports:

```typescript
export default {
  server: {
    hostName: 'localhost',
    port: 8080,
  },
  database: {
    username: 'root',
    password: 'root',
  }
}
```

Either of these will add two keys to the compiled application config object.

You can get at these values as:

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await config().get('server.hostName')
  const port: number = await config().get('server.port')
  return new Client(host, port)
}
```

#### Returning Promises

When using `js` or `ts` configs your conifg values can be Promises. Dynamic Config will resolve all Promises while building the ultimate representation of your application config.

As an example, this could be your local `js` config file:

```typescript
export const server = Promise.resolve({
  hostName: 'localhost',
  port: 8080
})
```

Then when you fetch from Dynamic Config the Promise in your config is transparent:

```typescript
import { config } from '@creditkarma/dynamic-config'

export async function createHttpClient(): Promise<Client> {
  const host: string = await config().get('server.hostName')
  const port: number = await config().get('server.port')
  return new Client(host, port)
}
```

Promises can also be nested, meaning keys within your returned config object can also have Promise values. Dynamic Config will recursively resolve all Promises before placing values in the resolved config object.

This API can be used for loading config values from sources that don't neatly fit with the rest of the API. It does however make configs more messy and should ideally be used sparingly. We'll cover how to get values from remote sources in a more organized fashion shortly.

*Note: If a nested Promise rejects the wrapping Promise also rejects and all values within the wrapping Promise are ignored.*

### Config Schema

At runtime a schema (a subset of [JSON Schema](http://json-schema.org/)) is built from this default config file. You can only use keys that you define in your default config and they must have the same shape. Config values should be predictable. If the form of your config is mutable this is very likely the source (or result of) a bug.

### Local Overrides

You can override the values from the default config in a variety of ways, but they must follow the schema set by your default configuration file. Overwriting the default values is done by adding additional files corresponding to the value of `NODE_ENV`. For example if `NODE_ENV = 'development'` then the default configuration will be merged with a file named `config/development.(json|js|ts)`. Using this you could have different configuration files for `NODE_ENV = 'test'` or `NODE_ENV = 'production'`.

### Configuration Path

The path to the config files is configurable when instantiating the `DynamicConfig` object. The option can either be an absolute path or a path relative to `process.cwd()`. The option can be defined both when constructing an instance or through an environment variable.

In TypeScript:

```typescript
import { DynamicConfig } from '@creditkarma/dynamic-config'

const dynamicConfig: DynamicConfig = new DynamicConfig({
  configPath: './config',
})
```

Through environment:

```sh
$ export CONFIG_PATH=config
```

## Remote Configs

Remote configuration allows you to deploy configuration independent from your application source.

### Remote Resolver

Registering a remote resolver is fairly straight-forward. You use the `register` method on your config instance.

*Note: You can only register remote resolvers until your first call to `config.get()`. After this any attempt to register a resolver will raise an exception.*

```typescript
import { DynamicConfig, IRemoteOptions } from '@creditkarma/dynamic-config'

const config: DynamicConfig = new DynamicConfig()

config.register({
  type: 'remote'
  name: 'consul',
  init(instance: DynamicConfig, options: IRemoteOptions): Promise<any> {
    // Do set up and load any initial remote configuration
  },
  get<T>(key: string): Promise<T> {
    // Fetch your key
  }
})
```

The `register` method will accept a comma-separated of resolver objects.

For additional clarity, the resolver objects have the following TypeScript interface:

```typescript
interface IRemoteResolver {
  type: 'remote' | 'secret'
  name: string
  init(dynamicConfig: DynamicConfig, remoteOptions?: IRemoteOptions): Promise<any>
  get<T>(key: string): Promise<T>
}
```

You can also pass resolvers on the options object passed directly to the constructor:

```typescript
import { DynamicConfig, IRemoteOptions } from '@creditkarma/dynamic-config'

const config: DynamicConfig = new DynamicConfig({
  resolvers: [{
    type: 'remote'
    name: 'consul',
    init(instance: DynamicConfig, options: IRemoteOptions): Promise<any> {
      // Do set up and load any initial remote configuration
    },
    get<T>(key: string): Promise<T> {
      // Fetch your key
    }
  }]
})
```

#### `type`

The type parameter can be set to either `remote` or `secret`. The only difference is that `remote` allows for default values.

#### `name`

The name for this remote. This is used to lookup config placeholders. We'll get to that in a bit.

#### `init`

The init method is called and resolved before any request to `get` can be completed. The init method returns a Promise. The resolved value of this Promise is deeply merged with the local config files. This is where you load remote configuration that should be available on application startup.

The init method receives an instance of the `DynamicConfig` object it is being registered on and any optional parameters that we defined on the `DynamicConfig` instance.

To define `IRemoteOptions` for a given remote resolver we use the `remoteOptions` parameter on the constructor config object:

```typescript
const config: DynamicConfig = new DynamicConfig({
  remoteOptions: {
    consul: {
      consulAddress: 'http://localhost:8500',
      consulKvDc: 'dc1',
      consulKeys: 'production-config',
    }
  }
})
```

When a resolver with the name `'consul'` is registered this object will be passed to the init method. Therefore, the `remoteOptions` parameter is of the form:

```typescript
interface IRemoteOptions {
  [resolverName: string]: IResolverOptions
}
```

#### `get`

This is easy, given a string key return a value for it. This method is called when a value in the config needs to be resolved remotely. Usually this will be because of a config placeholder. Once this method resolves, the return value will be cached in the config object and this method will not be called for that same key again.

### Config Resolution

Remote configuration is given a higher priority than local configuration. Local configuration is resolved, an initial configuration object it generated. Then the `init` method for each of the registered resolvers is called, in the order they were registered, and the return value is merged with the current configuration object.

#### Config Overlay

As a further example of how configs are resolved. Here is an example of config overlay.

My local config files resolved to something like this:

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

And the Consul init method returned an object like this:

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

### Config Placeholders

A config placeholder is a place in the configuration that you call out that something should be resolved from a remote source. Say we are keeping all of our passwords in Vault. The current configuration object, before calling Vault, may have a section like this:

```json
"database": {
  "username": "root",
  "password": {
    "_source": "vault",
    "_key": "my-service/password"
  }
}
```

Okay, so a config place holder is an object with two required parameters `_source` and `_key` and two optional parameters `_type` and `_default`.

The interface:

```typescript
interface IConfigPlaceholder {
  _source: string
  _key: string
  _type?: 'string' | 'number' | 'object' | 'array' | 'boolean'
  _default?: any
}
```

* `_source` - The name of the remote to resolve this key from.
* `_key` - A string to search the remote for.
* `_type` - Indicates how to try to parse this value. If no type is provided then the raw value returned from the source is used (usually a string). This value is given to the underlying resolver to make decisions. Some resolvers (as is the case with Consul and Vault) may choose to ignore the `_type` property.
* `_default` - A default value for the case that placeholder resolution fails. This property is ignored for `secret` resolvers. If no default an exception is raised for missing keys.

In the example above, using the default configuration for Vault, the database password will be requested from `http://localhost:8200/secret/my-service/password`.

If we're looking for a key in a remote registered simply as type `remote` we can provide a default value.

```json
{
  "server": {
    "host": {
      "_source": "consul",
      "_key": "my-service/host",
      "_default": "localhost"
    },
    "port": 8080
  }
}
```

In this case if the key `my-service/host` can't be found in Consul, or if Consul just isn't configured, then the default value `'localhost'` is returned.

#### Evnironment Placeholders

Environment placeholders are used to override config values with envirnoment variables. Environment placeholders are resolved with a special internal resolver similar to what we have already seen.

An envirnoment place holder is called out by having your placeholder `_source` property set to `'env'`.

```json
"server": {
  "host": {
    "_source": "env",
    "_key": "HOSTNAME",
    "_default": "localhost"
  },
  "port": 8080
}
```

Here `_key` is the name of the environment variable to look for. You can use `_default` for environment placeholders.

#### Process Placeholders

Similar to environment placeholders, process placeholders allow you to override config values with values passed in on the command line.

A process place holder is called out by having your placeholder `_source` property set to `'process'`.

```json
"server": {
  "host": {
    "_source": "process",
    "_key": "HOSTNAME",
    "_default": "localhost"
  },
  "port": 8080
}
```

Then when you start your application you can pass ine `HOSTNAME` as a command line option.

```sh
$ node my-app.js HOSTNAME=localhost
```

Process placeholders must be of this form `<name>=<value>`. The equal sign (`=`) is required.

Here `_key` is the name of the environment variable to look for. You can use `_default` for process placeholders.

## Supplied Resolvers

As mentioned, config data sources are added as `IRemoteResolver` objects. These can be used to load full JSON config objects, partial objects or single values. The API for adding custom resolvers is hopefully straight-forward.

This library includes a few resolvers, all of which are registered when using the singleton instance.

Those are:

- *Environment* - Reads values from environment variables.
- *Process* - Reads values passed in on command line `process.argv`.
- *Consul* - Reads remote configuration stored in Consul.
- *Vault* - Reads remote configuration stored in Vault.

When building your own instance of `DynamicConfig` you can pick and choose which of these to use.

```typescript
import {
  environmentResolver,
  processResolver,
  consulResolver,
  vaultResolver,
  DynamicConfig,
} from '@creditkarma/dynamic-config'

const config = new DynamicConfig({
  resolvers: [
    consulResolver(),
    vaultResolver(),
    environmentResolver(),
    processResolver(),
  ]
})
```

### Consul Configs

Dynamic Config ships with support for Consul. Now we're going to explore some of the specifics of using the included Consul resolver. The underlying Consul client comes from: [@creditkarma/consul-client](https://github.com/creditkarma/thrift-server/tree/dynamic-config/packages/consul-client).

Values stored in Consul are assumed to be JSON structures that can be deeply merged with local configuration files. As such configuration from Consul is merged on top of local configuration, overwriting local configuration in the resulting config object.

You define what configs to load from Consul through the `CONSUL_KEYS` option. This option can be set when constructing an instance or through an environment variable for the singleton instance. The values loaded with these keys are expected to be valid JSON objects.

In TypeScript:

```typescript
const dynamicConfig: DynamicConfig = new DynamicConfig({
  remoteOptions: {
    consul: {
      consulKeys: 'production-config,production-east-config',
    }
  }
})
```

Through environment:

```sh
$ export CONSUL_KEYS=production-config,production-east-config
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

#### Command Line Options

All of the above options can also be passed on the command line when starting your application:

```sh
$ node my-app.js CONSUL_ADDRESS=http://localhost:8500 CONSUL_KV_DC=dc1 CONSUL_KEYS=production-config,production-east-config CONFIG_PATH=config
```

#### Constructor Options

They can also be set on the DynamicConfig constructor.

```typescript
const config: DynamicConfig = new DynamicConfig({
  configPath: 'config',
  configEnv: 'development',
  remoteOptions: {
    consul: {
      consulAddress: 'http://localhost:8500',
      consulKvDc: 'dc1',
      consulKeys: 'production-config',
    }
  }
})
```

### Vault Configuration

The configuration for Vault needs to be available somewhere in the config path, either in a local config or in Consul (or some other registered remote). This configuration mush be available under the key name `'hashicorp-vault'`.

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

##### `getSecretValue`

Will try to get a key from whatever remote is registered as a `secret` store.

Based on the configuration the following code will try to load a secret from `http://localhost:8200/secret/username`.

```typescript
client.getSecretValue<string>('username').then((val: string) => {
  // Do something with secret value
})
```

#### Config Placeholders

As mentioned config placeholders can also be used for `secret` stores. Review above for more information.

## Roadmap

* Add ability to watch a value for runtime changes
* Pull K/V store functionality out into own module
* Explore options for providing a synchronous API

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)