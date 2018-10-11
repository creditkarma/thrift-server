# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="0.9.0"></a>
## [0.9.0](https://github.com/creditkarma/thrift-server/compare/v0.8.2...v0.9.0) (2018-10-11)


### Features

* **thrift-server-core:** Add types for annotations

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
