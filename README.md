# Thrift Server

A set of libraries for building microservices in Node.js, written in TypeScript.

As the name would suggest these libraries use [Apache Thrift](https://thrift.apache.org/) for service-to-service communication with RPC. All libraries come ready with distributed tracing through [Zipkin](https://zipkin.io/).

The available libraries:
* [Thrift Server Hapi](./packages/thrift-server-hapi): Plugin to add Thrift support to Hapi.
* [Thrift Server Express](./packages/thrift-server-express): Middleware to add Thrift support to Express.
* [Thrift Client](./packages/thrift-client): Thrift HTTP client built on top of [Request](https://github.com/request/request) and a TCP client build on Node sockets. Both support communicating with services created by the Twitter [Finagle](https://github.com/twitter/finagle) project.

*Note: Thrift Server is young and will still be undergoing some breaking changes before v1.0.0. The rule of thumb before 1.0.0 is that minor releases will potentially include breaking changes, but patch versions will not.*

## Development

To build and run `thrift-server` locally you can follow these steps.

First, clone the repo:

```sh
$ git clone https://github.com/creditkarma/thrift-server.git
```

Because `thrift-server` is a mono-repo containing multiple libraries, we use [lerna](https://lernajs.io/) to manage inter-dependencies. Running common `npm` commands at the project root will run these commands in all the packages.

Install dependencies and build libraries:

```sh
$ cd thirft-server
$ npm install
$ npm run build
```

To see things working you can run `npm test`:

```sh
$ npm test
```

## Building a Working Application

Let's make a quick working application with the included libraries.

We'll do this step by step:

* Create a project
* Install dependencies
* Define our service
* Run codegen on our Thrift IDL
* Create a service
* Create a service client
* Make service calls with our client

### Create a Project Directory

We need a place to build things:

```sh
$ mkdir thirft-example
$ cd thrift-example
```

Next initialize our workspace:

```sh
$ git init
$ npm init
```

I create directories for our source code and our Thrift IDL:

```sh
$ mkdir thrift
$ mkdir src
```

#### Setting up TypeScript

I'm going to be using TypeScript so I'm going to add a `tsconfig.json` file to my project root.

That file looks like this:

```json
{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "sourceMap": true,
        "declaration": true,
        "rootDir": "./src",
        "outDir": "./dist",
        "noEmitOnError": true,
        "strict": true,
        "noUnusedLocals": true,
        "pretty": true
    },
    "exclude": [
        "node_modules",
        "dist"
    ]
}
```

I'm also going to add some scripts to by `package.json` to build the TypeScript:

```json
"scripts": {
    // ...
    "prebuild": "rm -rf dist",
    "build": "tsc",
    // ...
}
```

### Install Dependencies

Because Thrift Server is developed with TypeScript and recommended usage is with TypeScript, all Thrift Server libraries define dependencies as peer dependencies to avoid type collisions.

```sh
$ npm install --save-dev typescript
$ npm install --save-dev @creditkarma/thrift-typescript
$ npm install --save @creditkarma/thrift-server-core
$ npm install --save @creditkarma/thrift-server-hapi
$ npm install --save @creditkarma/thrift-client
$ npm install --save request
$ npm install --save @types/request
$ npm install --save hapi
$ npm install --save @types/hapi
```

### Example Service

Our Thrift service contract looks like this:

```c
service Calculator {
  i32 add(1: i32 left, 2: i32 right)
  i32 subtract(1: i32 left, 2: i32 right)
}
```

I save this file in my project as `thrift/calculator.thrift`.

### Generating Service Code

We generate TypeScript from our Thrift IDL using [thrift-typescript](https://github.com/creditkarma/thrift-typescript). In my `package.json` I add something like this:

**v0.9.x of this library requires thrift-typescript v3.x**
**v0.7.x - 0.8.x of this library requires thrift-typescript v2.x**

```json
"scripts": {
    // ...
    "codegen": "thrift-typescript --target thrift-server --sourceDir thrift --outDir src/generated",
    // ...
}
```

No we can can generate our service interfaces by:

```sh
$ npm run codegen
```

If everything went well there should now be a new file at `src/generated/calculator.ts`.

Every generated service exports 3 common types (others may be exported on a service-to-service basis). In the `<service-name>.ts` file `service` becomes a `namespace` so there is now a `namespace` in `calculator.ts` called `Calculator`. The 3 types I mentioned are nested in this `namespace`.

The three common types:

* IHandler: An interface for the service methods
* Processor: A class that is constructed with an object of type `IHandler`. This handles decoding service requests and encoding service responses.
* Client: A class that provides the public interface for consumers. This handles encoding service requests and decoding service responses.

### Creating a Service

To create a Thrift service you need to first choose you Node Http server library. Thrift Server supports either Express or Hapi. For this example we are using Hapi, but the Express usage is almost identical.

No matter which option you choose Thrift support is added to the chosen server via plugin/middleware.

We need a new file. I'm calling mine `src/server.ts`.

The code to implement this service is pretty straight-forward:

```typescript
import * as Hapi from 'hapi'
import { ThriftServerHapi } from '@creditkarma/thrift-server-hapi'
import { Calculator } from './generated/calculator'

const PORT: number = 8080

const server = new Hapi.Server()

server.connection({ port: PORT })

/**
 * Implementation of our Thrift service.
 *
 * Notice the second parameter, "context" - this is the Hapi request object,
 * passed along to our service by the Hapi Thrift plugin. Thus, you have access to
 * all HTTP request data from within your service implementation.
 */
const serviceHandlers: Calculator.IHandler<Hapi.Request> = {
    add(left: number, right: number, context?: express.Request): number {
        return left + right
    },
    subtract(left: number, right: number, context?: express.Request): number {
        return left - right
    },
}

const processor: Calculator.Processor<Hapi.Request> = new Calculator.Processor(serviceHandlers)

/**
 * Register the Thrift plugin.
 *
 * This plugin adds a route to your server for handling Thrift requests. The path
 * option is the path to attach the route handler to and the handler is the
 * Thrift service processor instance.
 */
server.register(ThriftServerHapi<Calculator.Processor>({
    path: '/thrift',
    thriftOptions: {
        serviceName: 'calculator-service',
        handler: processor,
    }
}), err => {
    if (err) {
        throw err
    }
})

/**
 * Start your hapi server
 */
server.start((err) => {
    if (err) {
        throw err
    }
    server.log('info', `Thrift service running on port ${PORT}`)
})
```

### Creating a Service Client

Creating a service client is similarly not that difficult.

I'm adding the following code to a file called `src/client.ts`.

```typescript
import {
    createHttpClient
} from '@creditkaram/thrift-client'

import { CoreOptions } from 'request'

import { Calculator } from './codegen/calculator'

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createHttpClient(Calculator.Client, {
    serviceName: 'calculator-service',
    hostName: 'localhost', // The host of the service to connect to
    port: 8080, // The port of the service to connect to
    requestOptions: {} // CoreOptions to pass to Request
})
```

The `thrift-client` library uses [Request](https://github.com/request/request) as its underlying Http client. You will notice in the sample code the `requestOptions` parameter. This is optional and is passed through to the Request instance. This can be used to handle things like serving Thrift with TLS.

### Making Service Calls

Okay, so we have a service and a client, let's see this thing in action. To do that we're going to setup a simple web server in front of our Thrift client.

Because we're already using Hapi, let's add this to our `src/client.ts` file:

```typescript
import {
    createHttpClient
} from '@creditkaram/thrift-client'

import * as Hapi from 'hapi'

import { CoreOptions } from 'request'

import { Calculator } from './codegen/calculator'

// Create Thrift client
const thriftClient: Calculator.Client<CoreOptions> = createHttpClient(Calculator.Client, {
    serviceName: 'calculator-service',
    hostName: 'localhost',
    port: 8080,
    requestOptions: {} // CoreOptions to pass to Request
})

const server = new Hapi.Server({ debug: { request: ['error'] } })

const PORT = 9000
server.connection(PORT)

server.route({
    method: 'GET',
    path: '/add/{left}/{right}',
    handler(request: Hapi.Request, reply: Hapi.ReplyWithContinue) {
        thriftClient.add(request.params.left, request.params.right)
            .then((response: RecommendationsResponse) => {
                reply(response)
            })
            .catch((err: any) => {
                reply(err)
            })
    },
})

server.start((err: any) => {
    if (err) {
        throw err
    }
    server.log('info', `Web server running on port ${PORT}`)
})
```

I'm also going to add a file `src/index.ts` that will start the service and the client.

```typescript
import { fork } from 'child_process'

const clientProc = fork('./client.js')
const serverProc = fork('./server.js')

function exit(code: number) {
    clientProc.kill()
    serverProc.kill()
    process.exitCode = code
}

process.on('SIGINT', () => {
    console.log('Caught interrupt signal')
    exit(0)
})
```

Back in `package.json` I'm going to add another script to start our app:

```json
"scripts": {
    // ...
    "start": "npm run codegen && npm run build && node dist/index.js",
    // ...
}
```

Finally, we can:

```sh
$ npm start
```

And:

```sh
$ curl http://localhost:9000/add/5/6
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](./CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
