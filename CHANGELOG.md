# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="0.15.0"></a>
## [0.15.0](https://github.com/creditkarma/thrift-server/compare/v0.14.6...v0.15.0) (2019-10-02)

### BREAKING CHANGES

* Updated hapi to the latest version to address snyk vulnerability, moving hapi to @hapi/hapi ([fa3543](https://github.com/creditkarma/thrift-server/commit/fa3543bdf84e7a9e2fbf71d04cc7aafa83f5c3a8))


<a name="0.14.6"></a>
## [0.14.6](https://github.com/creditkarma/thrift-server/compare/v0.14.0...v0.14.6) (2019-09-05)

### Features

* Added blacklist to thrift-client ([1cdf0a](https://github.com/creditkarma/thrift-server/commit/1cdf0ad53c40f37727edc9cacbf5922b681d94ec)) ([469af4](https://github.com/creditkarma/thrift-server/commit/469af48f290cc48b87d369faa5b81df0fc5a6b59))
* Added runtime check for types into binary protocol([9e5c1e](https://github.com/creditkarma/thrift-server/commit/9e5c1e617192a6a46adb87ec37b35a583ff6ad77))


<a name="0.14.0"></a>
## [0.14.0](https://github.com/creditkarma/thrift-server/compare/v0.13.5...v0.14.0) (2019-08-09)

### BREAKING CHANGES

* Support for stripping header structs ([60e84c](https://github.com/creditkarma/thrift-server/commit/60e84c7fcd109a553f855da6af1d98f0aef667c3))


<a name="0.13.5"></a>
## [0.13.5](https://github.com/creditkarma/thrift-server/compare/v0.12.5...v0.13.5) (2019-03-28)

### Bug fixes

* Correct annotation types for thrift client ([14a95a](https://github.com/creditkarma/thrift-server/commit/14a95a0970cd80bfbca87382419fd1151a1c9add))


<a name="0.12.5"></a>
## [0.12.5](https://github.com/creditkarma/thrift-server/compare/v0.12.0...v0.12.5) (2019-01-14)

### Bug fixes

* Correct an issue when path is incorrectly constructed ([0377e1a](https://github.com/creditkarma/thrift-server/commit/0377e1a52d219cc6783f35fd326fa2320e601c12))


<a name="0.12.0"></a>
## [0.12.0](https://github.com/creditkarma/thrift-server/compare/v0.11.0...v0.12.0) (2019-01-11)

### Features

* Add support to `thrift-client` and `thrift-server-hapi` to support endpoint-per-method ([d85c58](https://github.com/creditkarma/thrift-server/commit/d85c58))


<a name="0.11.0"></a>
## [0.11.0](https://github.com/creditkarma/thrift-server/compare/v0.10.4...v0.11.0) (2018-11-27)

### BREAKING CHANGES

* Splits plugins/middleware into their own packages ([f5f344](https://github.com/creditkarma/thrift-server/commit/f5f344))

The APIs for plugins is unchanged. It's just that the plugins are no longer included with their given client/server.

For example if you want to include Zipkin tracing for [thrift-client](./packages/thrift-client) you know have to also install the [zipkin-client-filter](./packages/zipkin-client-filter).

```sh
npm install --save @creditkarma/thrift-server-core
npm install --save @creditkarma/thrift-client
npm install --save @creditkarma/thrift-zipkin-core
npm install --save @creditkarma/zipkin-client-filter
```

And then use it as such:

```typescript
import {
    createHttpClient,
} from '@creditkaram/thrift-client'

import {
    ThriftClientZipkinFilter,
} from '@creditkarma/thrift-client-zipkin-filter'

import { Calculator } from './codegen/calculator'

const thriftClient: Calculator.Client<ThriftContext<CoreOptions>> =
    createHttpClient(Calculator.Client, {
        hostName: 'localhost',
        port: 8080,
        register: [ ThriftClientZipkinFilter({
            localServiceName: 'calculator-client',
            remoteServiceName: 'calculator-service',
            tracerConfig: {
                endpoint: 'http://localhost:9411/api/v1/spans',
                sampleRate: 0.1,
            }
        }) ]
    })
```

### Features

* A new filter for client timing metrics ([thrift-client-timing-filter](./packages/thrift-client-timing-filter))


<a name="0.10.0"></a>
## [0.10.0](https://github.com/creditkarma/thrift-server/compare/v0.9.3...v0.10.0) (2018-11-16)

### BREAKING CHANGES

* Cleaned up format of Zipkin options ([de5601f](https://github.com/creditkarma/thrift-server/commit/de5601f))

### Features

* Allow users to provide their own logging function ([30f3793](https://github.com/creditkarma/thrift-server/commit/30f3793))


<a name="0.9.0"></a>
## [0.9.0](https://github.com/creditkarma/thrift-server/compare/v0.8.2...v0.9.0) (2018-10-11)

### BREAKING CHANGES

* Update to use TypeScript v3 ([cd33cd](https://github.com/creditkarma/thrift-server/commit/cd33cd1e062c09049cd6c95a06b81b3920f29a8d))

* **thrift-server-hapi:** Update to use Hapi 17 ([3844d4](https://github.com/creditkarma/thrift-server/commit/3844d472bc15f764374177c003fe2f2c950ff1f0))

### Features

* **thrift-server-core:** Add types for annotations ([22804d](https://github.com/creditkarma/thrift-server/commit/22804d4821ef304ef7e7b947976b68e19c321614))


<a name="0.8.0"></a>
## [0.8.0](https://github.com/creditkarma/thrift-server/compare/v0.7.3...v0.8.0) (2018-08-16)

### BREAKING CHANGES

* Change the client plugin API so that the handler function expects two arguments ([d4f38e](https://github.com/creditkarma/thrift-server/commit/d4f38e))

The big change here is that the client middle ware object changed from this:

```typescript
interface IThriftMiddlewareConfig<Options> {
    methods?: Array<string>
    handler(data: Buffer, context: ThriftContext<Options>, next: NextFunction<Options>): Promise<IRequestResponse>
}
```

To this:

```typescript
interface IThriftClientFilterConfig<Options> {
    methods?: Array<string>
    handler(request: IThriftRequest<Options>, next: NextFunction<Options>): Promise<IRequestResponse>
}
```

The new `IThriftRequest` object contains the outgoing payload on the `data` property and the user-passed context on the `context` property. Beyond this more data about the outgoing request is present, specifically the `uri` and the service `methodName`.


<a name="0.6.2"></a>
## [0.6.2](https://github.com/creditkarma/thrift-server/compare/v0.6.1...v0.6.2) (2018-03-13)

### Bug Fixes

* Bump peer dependencies ([256bdce](https://github.com/creditkarma/thrift-server/commit/256bdce))


<a name="0.6.1"></a>
## [0.6.1](https://github.com/creditkarma/thrift-server/compare/v0.6.0...v0.6.1) (2018-03-13)

### Bug Fixes

* **thrift-server-hapi:** Fix naming of plugin ([d288caf](https://github.com/creditkarma/thrift-server/commit/d288caf))


<a name="0.6.0"></a>
# [0.6.0](https://github.com/creditkarma/thrift-server/compare/v0.5.1...v0.6.0) (2018-03-13)

### Features

* **thrift-server-hapi:** Allow passing auth strategy to hapi plugin ([#55](https://github.com/creditkarma/thrift-server/issues/55)) ([f84e73b](https://github.com/creditkarma/thrift-server/commit/f84e73b))


<a name="0.5.1"></a>
## [0.5.1](https://github.com/creditkarma/thrift-server/compare/v0.5.0...v0.5.1) (2018-03-12)

### Bug Fixes

* Update peerDependencies ([752728c](https://github.com/creditkarma/thrift-server/commit/752728c))


<a name="0.5.0"></a>
# [0.5.0](https://github.com/creditkarma/thrift-server/compare/v0.4.3...v0.5.0) (2018-03-12)

### Bug Fixes

* **dynamic-config:** use typescript compiler to load typescript configs ([#48](https://github.com/creditkarma/thrift-server/issues/48)) ([e4fe62b](https://github.com/creditkarma/thrift-server/commit/e4fe62b))
* **thrift-client:** fix linting error ([46e8727](https://github.com/creditkarma/thrift-server/commit/46e8727))
* **thrift-client:** Update test server with facotry function ([6608ef4](https://github.com/creditkarma/thrift-server/commit/6608ef4))
* Have zipkin plugin generate root traceid if none ([09acbd6](https://github.com/creditkarma/thrift-server/commit/09acbd6))

### Features

* **thrift-server-express:** Add factory to create thrift servers ([2d37def](https://github.com/creditkarma/thrift-server/commit/2d37def))
* **thrift-server-hapi:** Add factory to create thrift servers ([#49](https://github.com/creditkarma/thrift-server/issues/49)) ([372765b](https://github.com/creditkarma/thrift-server/commit/372765b))
* Add Zipkin plugins ([33eeb24](https://github.com/creditkarma/thrift-server/commit/33eeb24))
* Support distributed tracing with zipkin ([377e0c6](https://github.com/creditkarma/thrift-server/commit/377e0c6))
