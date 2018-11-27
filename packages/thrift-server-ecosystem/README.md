# Thrift Ecosystem

## Running the Sample Application

Included in this repo is a sample application that uses `thrift-client` and `thrift-server-hapi`. To get the sample application up and running you need to do a few things.

First, clone the `thrift-server` repo:

```sh
$ git clone https://github.com/creditkarma/thrift-server.git
```

Then, `cd` into the `thrift-server` directory and run `npm install` and `npm run build`.

```sh
$ cd thrift-server
$ npm install
$ npm run build
```

The `thrift-server` project uses [lerna](https://lernajs.io/) to manage inter-library dependencies. The `npm install` command will obviously install all your dependencies, but it will also perform a `lerna bootstrap` that will set up sym-links between all the libraries within the mono-repo.

Now that everything is linked and built we can go to the `thrift-client` package and start the example application:

```sh
$ cd packages/thrift-client
$ npm start
```

This will start a web server on localhost:8080. The sample app has a UI you can visit from a web browser.

### Running Zipkin

The example app is configured to emit Zipkin traces. To view these traces run the Zipkin Docker image:

```sh
$ docker run -d -p 9411:9411 openzipkin/zipkin
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](../../CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
