import {
  createWebServer,
  TBinaryProtocol,
  TBufferedTransport,
} from 'thrift'

import { Operation, Calculator, Work } from './codegen/tutorial/tutorial'

const myServiceHandler = {
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
};

const myServiceOpts = {
  handler: myServiceHandler,
  processor: Calculator,
  protocol: TBinaryProtocol,
  transport: TBufferedTransport
};

const serverOpt = {
   services: {
      '/': myServiceOpts
   }
};

const port: number = 8045;
createWebServer<Calculator.Processor<void>, Calculator.IHandler<void>>(serverOpt).listen(port, () => {
  console.log(`Thrift server listening on port ${port}`)
});
