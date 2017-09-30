import {
  createWebServer,
  TBinaryProtocol,
  TBufferedTransport,
} from 'thrift'

import { ThriftPlugin } from '@creditkarma/thrift-server-hapi'
import Hapi = require('hapi');

import { Operation, Calculator, Work } from './generated/tutorial/tutorial'
import { SharedStruct } from './generated/shared/shared'

const server: Hapi.Server = new Hapi.Server();
server.connection({ port: 8045, host: 'localhost' });

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
      return new SharedStruct();
    }
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