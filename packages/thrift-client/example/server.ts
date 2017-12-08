import { ThriftPlugin } from '@creditkarma/thrift-server-hapi'
import Hapi = require('hapi');

import { Operation, Calculator, Work } from './generated/calculator/calculator'
import { SharedStruct, SharedUnion } from './generated/shared/shared'

import {
  SERVER_CONFIG
} from './config'

const server: Hapi.Server = new Hapi.Server();
server.connection(SERVER_CONFIG);

server.register(ThriftPlugin, (err: any) => {
  if (err) {
    throw err;
  }
});

const impl = new Calculator.Processor({
    ping(): void {},
    add(a: number, b: number): number {
      return a + b;
    },
    calculate(logId: number, work: Work): number {
      switch (work.op) {
        case Operation.ADD:
          return work.num1 + work.num2;
        case Operation.SUBTRACT:
          return work.num1 - work.num2;
        case Operation.DIVIDE:
          return work.num1 / work.num2;
        case Operation.MULTIPLY:
          return work.num1 * work.num2;
      }
    },
    zip(): void {},
    getStruct(): SharedStruct {
      return new SharedStruct({
        key: 0,
        value: 'test',
      })
    },
    getUnion(index: number): SharedUnion {
      if (index === 1) {
        return SharedUnion.fromOption1('foo')
      } else {
        return SharedUnion.fromOption2('bar')
      }
    },
})

server.route({
    method: 'POST',
    path: '/',
    handler: {
        thrift: {
            service: impl,
        },
    },
    config: {
        payload: {
            parse: false,
        },
    },
});

server.start((err: any) => {
  if (err) {
    throw err;
  }

  if (server.info !== null) {
    console.log(`Thrift server running at: ${server.info.uri}`);
  }
});
