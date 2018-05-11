import * as net from 'net'
import * as thrift from 'thrift'

import {
    Calculator,
    Choice,
    Operation,
    Work,
} from './generated-apache/calculator/calculator'

import {
    SharedStruct,
    SharedUnion,
} from './generated-apache/shared/shared'

export function createServer(): net.Server {
    const impl: Calculator.IHandler = {
        ping(): void {
            return
        },
        add(a: number, b: number): number {
            return a + b
        },
        addInt64(a: thrift.Int64, b: thrift.Int64): thrift.Int64 {
            return new thrift.Int64(a.toNumber() + b.toNumber())
        },
        addWithContext(a: number, b: number): number {
            return a + b
        },
        calculate(logId: number, work: Work): number {
            switch (work.op) {
                case Operation.ADD:
                    return work.num1 + work.num2
                case Operation.SUBTRACT:
                    return work.num1 - work.num2
                case Operation.DIVIDE:
                    return work.num1 / work.num2
                case Operation.MULTIPLY:
                    return work.num1 * work.num2
            }
        },
        zip(): void {
            return
        },
        getStruct(key: number): SharedStruct {
            return new SharedStruct({
                key,
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
        echoBinary(word: Buffer): string {
            return word.toString('utf-8')
        },
        echoString(word: string): string {
            return word
        },
        checkName(choice: Choice): string {
            if (choice.firstName !== undefined) {
                return `FirstName: ${choice.firstName.name}`
            } else if (choice.lastName !== undefined) {
                return `LastName: ${choice.lastName.name}`
            } else {
                throw new Error(`Unknown choice`)
            }
        },
        checkOptional(type?: string): string {
            if (type === undefined) {
                return 'undefined'
            } else {
                return type
            }
        },
        mapOneList(list: Array<number>): Array<number> {
            return list.map((next: number) => next + 1)
        },
        mapValues(map: Map<string, number>): Array<number> {
            return Array.from(map.values())
        },
        listToMap(list: Array<Array<string>>): Map<string, string> {
            return list.reduce(
                (acc: Map<string, string>, next: Array<string>) => {
                    acc.set(next[0], next[1])
                    return acc
                },
                new Map(),
            )
        },
    }

    return thrift.createServer<Calculator.Processor, Calculator.IHandler>(Calculator.Processor, impl, {})
}
