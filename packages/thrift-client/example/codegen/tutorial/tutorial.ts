import { Thrift, TProtocol, TTransport, Int64 } from "thrift";
import { SharedService as shared$SharedService } from "./../shared/shared";
export type MyInteger = number;
export const INT32CONSTANT: number = 9853;
export const MAPCONSTANT: Map<string, string> = new Map([["hello", "world"], ["goodnight", "moon"]]);
export enum Operation {
    ADD = 1,
    SUBTRACT = 2,
    MULTIPLY = 3,
    DIVIDE = 4
}
export interface IWorkArgs {
    num1: number;
    num2: number;
    op: Operation;
    comment?: string;
}
export class Work {
    public num1: number = 0;
    public num2: number;
    public op: Operation;
    public comment: string;
    constructor(args?: IWorkArgs) {
        if (args != null) {
            if (args.num1 != null) {
                this.num1 = args.num1;
            }
            if (args.num2 != null) {
                this.num2 = args.num2;
            }
            if (args.op != null) {
                this.op = args.op;
            }
            if (args.comment != null) {
                this.comment = args.comment;
            }
        }
    }
    public write(output: TProtocol): void {
        output.writeStructBegin("Work");
        if (this.num1 != null) {
            output.writeFieldBegin("num1", Thrift.Type.I32, 1);
            output.writeI32(this.num1);
            output.writeFieldEnd();
        }
        if (this.num2 != null) {
            output.writeFieldBegin("num2", Thrift.Type.I32, 2);
            output.writeI32(this.num2);
            output.writeFieldEnd();
        }
        if (this.op != null) {
            output.writeFieldBegin("op", Thrift.Type.I32, 3);
            output.writeI32(this.op);
            output.writeFieldEnd();
        }
        if (this.comment != null) {
            output.writeFieldBegin("comment", Thrift.Type.STRING, 4);
            output.writeString(this.comment);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
    public read(input: TProtocol): void {
        input.readStructBegin();
        while (true) {
            const ret: {
                fname: string;
                ftype: Thrift.Type;
                fid: number;
            } = input.readFieldBegin();
            const ftype: Thrift.Type = ret.ftype;
            const fid: number = ret.fid;
            if (ftype === Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 1:
                    if (ftype === Thrift.Type.I32) {
                        const value_1: number = input.readI32();
                        this.num1 = value_1;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                case 2:
                    if (ftype === Thrift.Type.I32) {
                        const value_2: number = input.readI32();
                        this.num2 = value_2;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                case 3:
                    if (ftype === Thrift.Type.I32) {
                        const value_3: Operation = input.readI32();
                        this.op = value_3;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                case 4:
                    if (ftype === Thrift.Type.STRING) {
                        const value_4: string = input.readString();
                        this.comment = value_4;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                default: {
                    input.skip(ftype);
                }
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }
}
export interface IInvalidOperationArgs {
    whatOp: number;
    why: string;
}
export class InvalidOperation {
    public whatOp: number;
    public why: string;
    constructor(args?: IInvalidOperationArgs) {
        if (args != null) {
            if (args.whatOp != null) {
                this.whatOp = args.whatOp;
            }
            if (args.why != null) {
                this.why = args.why;
            }
        }
    }
    public write(output: TProtocol): void {
        output.writeStructBegin("InvalidOperation");
        if (this.whatOp != null) {
            output.writeFieldBegin("whatOp", Thrift.Type.I32, 1);
            output.writeI32(this.whatOp);
            output.writeFieldEnd();
        }
        if (this.why != null) {
            output.writeFieldBegin("why", Thrift.Type.STRING, 2);
            output.writeString(this.why);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
    public read(input: TProtocol): void {
        input.readStructBegin();
        while (true) {
            const ret: {
                fname: string;
                ftype: Thrift.Type;
                fid: number;
            } = input.readFieldBegin();
            const ftype: Thrift.Type = ret.ftype;
            const fid: number = ret.fid;
            if (ftype === Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 1:
                    if (ftype === Thrift.Type.I32) {
                        const value_5: number = input.readI32();
                        this.whatOp = value_5;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                case 2:
                    if (ftype === Thrift.Type.STRING) {
                        const value_6: string = input.readString();
                        this.why = value_6;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                default: {
                    input.skip(ftype);
                }
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }
}
export namespace Calculator {
    export interface IPingArgsArgs {
    }
    export class PingArgs {
        constructor(args?: IPingArgsArgs) {
            if (args != null) {
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("PingArgs");
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface IAddArgsArgs {
        num1: number;
        num2: number;
    }
    export class AddArgs {
        public num1: number;
        public num2: number;
        constructor(args?: IAddArgsArgs) {
            if (args != null) {
                if (args.num1 != null) {
                    this.num1 = args.num1;
                }
                if (args.num2 != null) {
                    this.num2 = args.num2;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("AddArgs");
            if (this.num1 != null) {
                output.writeFieldBegin("num1", Thrift.Type.I32, 1);
                output.writeI32(this.num1);
                output.writeFieldEnd();
            }
            if (this.num2 != null) {
                output.writeFieldBegin("num2", Thrift.Type.I32, 2);
                output.writeI32(this.num2);
                output.writeFieldEnd();
            }
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 1:
                        if (ftype === Thrift.Type.I32) {
                            const value_7: number = input.readI32();
                            this.num1 = value_7;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    case 2:
                        if (ftype === Thrift.Type.I32) {
                            const value_8: number = input.readI32();
                            this.num2 = value_8;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface ICalculateArgsArgs {
        logid: number;
        w: Work;
    }
    export class CalculateArgs {
        public logid: number;
        public w: Work;
        constructor(args?: ICalculateArgsArgs) {
            if (args != null) {
                if (args.logid != null) {
                    this.logid = args.logid;
                }
                if (args.w != null) {
                    this.w = args.w;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("CalculateArgs");
            if (this.logid != null) {
                output.writeFieldBegin("logid", Thrift.Type.I32, 1);
                output.writeI32(this.logid);
                output.writeFieldEnd();
            }
            if (this.w != null) {
                output.writeFieldBegin("w", Thrift.Type.STRUCT, 2);
                this.w.write(output);
                output.writeFieldEnd();
            }
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 1:
                        if (ftype === Thrift.Type.I32) {
                            const value_9: number = input.readI32();
                            this.logid = value_9;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    case 2:
                        if (ftype === Thrift.Type.STRUCT) {
                            const value_10: Work = new Work();
                            value_10.read(input);
                            this.w = value_10;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface IZipArgsArgs {
    }
    export class ZipArgs {
        constructor(args?: IZipArgsArgs) {
            if (args != null) {
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("ZipArgs");
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface IPingResultArgs {
        success?: void;
    }
    export class PingResult {
        public success: void;
        constructor(args?: IPingResultArgs) {
            if (args != null) {
                if (args.success != null) {
                    this.success = args.success;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("PingResult");
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 0:
                        if (ftype === Thrift.Type.VOID) {
                            input.skip(ftype);
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface IAddResultArgs {
        success?: number;
    }
    export class AddResult {
        public success: number;
        constructor(args?: IAddResultArgs) {
            if (args != null) {
                if (args.success != null) {
                    this.success = args.success;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("AddResult");
            if (this.success != null) {
                output.writeFieldBegin("success", Thrift.Type.I32, 0);
                output.writeI32(this.success);
                output.writeFieldEnd();
            }
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 0:
                        if (ftype === Thrift.Type.I32) {
                            const value_11: number = input.readI32();
                            this.success = value_11;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface ICalculateResultArgs {
        success?: number;
        ouch?: InvalidOperation;
    }
    export class CalculateResult {
        public success: number;
        public ouch: InvalidOperation;
        constructor(args?: ICalculateResultArgs) {
            if (args != null) {
                if (args.success != null) {
                    this.success = args.success;
                }
                if (args.ouch != null) {
                    this.ouch = args.ouch;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("CalculateResult");
            if (this.success != null) {
                output.writeFieldBegin("success", Thrift.Type.I32, 0);
                output.writeI32(this.success);
                output.writeFieldEnd();
            }
            if (this.ouch != null) {
                output.writeFieldBegin("ouch", Thrift.Type.STRUCT, 1);
                this.ouch.write(output);
                output.writeFieldEnd();
            }
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 0:
                        if (ftype === Thrift.Type.I32) {
                            const value_12: number = input.readI32();
                            this.success = value_12;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    case 1:
                        if (ftype === Thrift.Type.STRUCT) {
                            const value_13: InvalidOperation = new InvalidOperation();
                            value_13.read(input);
                            this.ouch = value_13;
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export interface IZipResultArgs {
        success?: void;
    }
    export class ZipResult {
        public success: void;
        constructor(args?: IZipResultArgs) {
            if (args != null) {
                if (args.success != null) {
                    this.success = args.success;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("ZipResult");
            output.writeFieldStop();
            output.writeStructEnd();
            return;
        }
        public read(input: TProtocol): void {
            input.readStructBegin();
            while (true) {
                const ret: {
                    fname: string;
                    ftype: Thrift.Type;
                    fid: number;
                } = input.readFieldBegin();
                const ftype: Thrift.Type = ret.ftype;
                const fid: number = ret.fid;
                if (ftype === Thrift.Type.STOP) {
                    break;
                }
                switch (fid) {
                    case 0:
                        if (ftype === Thrift.Type.VOID) {
                            input.skip(ftype);
                        }
                        else {
                            input.skip(ftype);
                        }
                        break;
                    default: {
                        input.skip(ftype);
                    }
                }
                input.readFieldEnd();
            }
            input.readStructEnd();
            return;
        }
    }
    export class Client extends shared$SharedService.Client {
        public _seqid: number;
        public _reqs: {
            [name: number]: (err: Error | object | undefined, val?: any) => void;
        };
        public output: TTransport;
        public protocol: new (trans: TTransport) => TProtocol;
        constructor(output: TTransport, protocol: new (trans: TTransport) => TProtocol) {
            super(output, protocol);
            this._seqid = 0;
            this._reqs = {};
            this.output = output;
            this.protocol = protocol;
        }
        public seqid(): number {
            return this._seqid;
        }
        public new_seqid(): number {
            return this._seqid += 1;
        }
        public ping(): Promise<void> {
            this._seqid = this.new_seqid();
            return new Promise<void>((resolve, reject): void => {
                this._reqs[this.seqid()] = (error, result) => {
                    if (error != null) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
                this.send_ping();
            });
        }
        public add(num1: number, num2: number): Promise<number> {
            this._seqid = this.new_seqid();
            return new Promise<number>((resolve, reject): void => {
                this._reqs[this.seqid()] = (error, result) => {
                    if (error != null) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
                this.send_add(num1, num2);
            });
        }
        public calculate(logid: number, w: Work): Promise<number> {
            this._seqid = this.new_seqid();
            return new Promise<number>((resolve, reject): void => {
                this._reqs[this.seqid()] = (error, result) => {
                    if (error != null) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
                this.send_calculate(logid, w);
            });
        }
        public zip(): Promise<void> {
            this._seqid = this.new_seqid();
            return new Promise<void>((resolve, reject): void => {
                this._reqs[this.seqid()] = (error, result) => {
                    if (error != null) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
                this.send_zip();
            });
        }
        public send_ping(): void {
            const output: TProtocol = new this.protocol(this.output);
            output.writeMessageBegin("ping", Thrift.MessageType.CALL, this.seqid());
            const args: PingArgs = new PingArgs({});
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        }
        public send_add(num1: number, num2: number): void {
            const output: TProtocol = new this.protocol(this.output);
            output.writeMessageBegin("add", Thrift.MessageType.CALL, this.seqid());
            const args: AddArgs = new AddArgs({ num1, num2 });
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        }
        public send_calculate(logid: number, w: Work): void {
            const output: TProtocol = new this.protocol(this.output);
            output.writeMessageBegin("calculate", Thrift.MessageType.CALL, this.seqid());
            const args: CalculateArgs = new CalculateArgs({ logid, w });
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        }
        public send_zip(): void {
            const output: TProtocol = new this.protocol(this.output);
            output.writeMessageBegin("zip", Thrift.MessageType.CALL, this.seqid());
            const args: ZipArgs = new ZipArgs({});
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        }
        public recv_ping(input: TProtocol, mtype: Thrift.MessageType, rseqid: number): void {
            const noop = (): any => null;
            const callback = this._reqs[rseqid] || noop;
            delete this._reqs[rseqid];
            if (mtype === Thrift.MessageType.EXCEPTION) {
                const x: Thrift.TApplicationException = new Thrift.TApplicationException();
                x.read(input);
                input.readMessageEnd();
                return callback(x);
            }
            const result = new PingResult();
            result.read(input);
            input.readMessageEnd();
            return callback(undefined);
        }
        public recv_add(input: TProtocol, mtype: Thrift.MessageType, rseqid: number): void {
            const noop = (): any => null;
            const callback = this._reqs[rseqid] || noop;
            delete this._reqs[rseqid];
            if (mtype === Thrift.MessageType.EXCEPTION) {
                const x: Thrift.TApplicationException = new Thrift.TApplicationException();
                x.read(input);
                input.readMessageEnd();
                return callback(x);
            }
            const result = new AddResult();
            result.read(input);
            input.readMessageEnd();
            if (result.success != null) {
                return callback(undefined, result.success);
            }
            else {
                return callback(new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, "add failed: unknown result"));
            }
        }
        public recv_calculate(input: TProtocol, mtype: Thrift.MessageType, rseqid: number): void {
            const noop = (): any => null;
            const callback = this._reqs[rseqid] || noop;
            delete this._reqs[rseqid];
            if (mtype === Thrift.MessageType.EXCEPTION) {
                const x: Thrift.TApplicationException = new Thrift.TApplicationException();
                x.read(input);
                input.readMessageEnd();
                return callback(x);
            }
            const result = new CalculateResult();
            result.read(input);
            input.readMessageEnd();
            if (result.ouch != null) {
                return callback(result.ouch);
            }
            if (result.success != null) {
                return callback(undefined, result.success);
            }
            else {
                return callback(new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, "calculate failed: unknown result"));
            }
        }
        public recv_zip(input: TProtocol, mtype: Thrift.MessageType, rseqid: number): void {
            const noop = (): any => null;
            const callback = this._reqs[rseqid] || noop;
            delete this._reqs[rseqid];
            if (mtype === Thrift.MessageType.EXCEPTION) {
                const x: Thrift.TApplicationException = new Thrift.TApplicationException();
                x.read(input);
                input.readMessageEnd();
                return callback(x);
            }
            const result = new ZipResult();
            result.read(input);
            input.readMessageEnd();
            if (result.success != null) {
                return callback(undefined, result.success);
            }
            else {
                return callback(new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, "zip failed: unknown result"));
            }
        }
    }
    export interface IHandler<Context> {
        ping: (context: Context) => void;
        add: (num1: number, num2: number, context: Context) => number;
        calculate: (logid: number, w: Work, context: Context) => number;
        zip: (context: Context) => void;
    }
    export class Processor<Context> extends shared$SharedService.Processor<Context> {
        public _handler: IHandler<Context> & shared$SharedService.IHandler<Context>;
        constructor(handler: IHandler<Context> & shared$SharedService.IHandler<Context>) {
            super({
                getStruct: handler.getStruct
            });
            this._handler = handler;
        }
        public process(input: TProtocol, output: TProtocol, context: Context): void {
            const metadata: {
                fname: string;
                mtype: Thrift.MessageType;
                rseqid: number;
            } = input.readMessageBegin();
            const fname: string = metadata.fname;
            const rseqid: number = metadata.rseqid;
            const methodName: string = "process_" + fname;
            switch (methodName) {
                case "process_getStruct": {
                    return this.process_getStruct(rseqid, input, output, context);
                }
                case "process_ping": {
                    return this.process_ping(rseqid, input, output, context);
                }
                case "process_add": {
                    return this.process_add(rseqid, input, output, context);
                }
                case "process_calculate": {
                    return this.process_calculate(rseqid, input, output, context);
                }
                case "process_zip": {
                    return this.process_zip(rseqid, input, output, context);
                }
                default: {
                    input.skip(Thrift.Type.STRUCT);
                    input.readMessageEnd();
                    const errMessage = "Unknown function " + fname;
                    const err = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN_METHOD, errMessage);
                    output.writeMessageBegin(fname, Thrift.MessageType.EXCEPTION, rseqid);
                    err.write(output);
                    output.writeMessageEnd();
                    output.flush();
                }
            }
        }
        public process_ping(seqid: number, input: TProtocol, output: TProtocol, context: Context): void {
            const args = new PingArgs();
            args.read(input);
            input.readMessageEnd();
            new Promise<void>((resolve, reject): void => {
                try {
                    resolve(this._handler.ping(context));
                }
                catch (err) {
                    reject(err);
                }
            }).then((data: void): void => {
                const result = new PingResult({ success: data });
                output.writeMessageBegin("ping", Thrift.MessageType.REPLY, seqid);
                result.write(output);
                output.writeMessageEnd();
                output.flush();
            }).catch((err: Error): void => {
                if (0 > 0) {
                }
                else {
                    const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin("ping", Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                    return;
                }
            });
        }
        public process_add(seqid: number, input: TProtocol, output: TProtocol, context: Context): void {
            const args = new AddArgs();
            args.read(input);
            input.readMessageEnd();
            new Promise<number>((resolve, reject): void => {
                try {
                    resolve(this._handler.add(args.num1, args.num2, context));
                }
                catch (err) {
                    reject(err);
                }
            }).then((data: number): void => {
                const result = new AddResult({ success: data });
                output.writeMessageBegin("add", Thrift.MessageType.REPLY, seqid);
                result.write(output);
                output.writeMessageEnd();
                output.flush();
            }).catch((err: Error): void => {
                if (0 > 0) {
                }
                else {
                    const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin("add", Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                    return;
                }
            });
        }
        public process_calculate(seqid: number, input: TProtocol, output: TProtocol, context: Context): void {
            const args = new CalculateArgs();
            args.read(input);
            input.readMessageEnd();
            new Promise<number>((resolve, reject): void => {
                try {
                    resolve(this._handler.calculate(args.logid, args.w, context));
                }
                catch (err) {
                    reject(err);
                }
            }).then((data: number): void => {
                const result = new CalculateResult({ success: data });
                output.writeMessageBegin("calculate", Thrift.MessageType.REPLY, seqid);
                result.write(output);
                output.writeMessageEnd();
                output.flush();
            }).catch((err: Error): void => {
                if (1 > 0) {
                    if (err instanceof InvalidOperation) {
                        const result: CalculateResult = new CalculateResult({ ouch: err });
                        output.writeMessageBegin("calculate", Thrift.MessageType.REPLY, seqid);
                        result.write(output);
                        output.writeMessageEnd();
                        output.flush();
                        return;
                    }
                    else {
                        const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                        output.writeMessageBegin("calculate", Thrift.MessageType.EXCEPTION, seqid);
                        result.write(output);
                        output.writeMessageEnd();
                        output.flush();
                        return;
                    }
                }
                else {
                    const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin("calculate", Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                    return;
                }
            });
        }
        public process_zip(seqid: number, input: TProtocol, output: TProtocol, context: Context): void {
            const args = new ZipArgs();
            args.read(input);
            input.readMessageEnd();
            new Promise<void>((resolve, reject): void => {
                try {
                    resolve(this._handler.zip(context));
                }
                catch (err) {
                    reject(err);
                }
            }).then((data: void): void => {
                const result = new ZipResult({ success: data });
                output.writeMessageBegin("zip", Thrift.MessageType.REPLY, seqid);
                result.write(output);
                output.writeMessageEnd();
                output.flush();
            }).catch((err: Error): void => {
                if (0 > 0) {
                }
                else {
                    const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin("zip", Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                    return;
                }
            });
        }
    }
}
