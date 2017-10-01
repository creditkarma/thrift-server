import { Thrift, TProtocol, TTransport, Int64 } from "thrift";
export interface ISharedStructArgs {
    key: number;
    value: string;
}
export class SharedStruct {
    public key: number;
    public value: string;
    constructor(args?: ISharedStructArgs) {
        if (args != null) {
            if (args.key != null) {
                this.key = args.key;
            }
            if (args.value != null) {
                this.value = args.value;
            }
        }
    }
    public write(output: TProtocol): void {
        output.writeStructBegin("SharedStruct");
        if (this.key != null) {
            output.writeFieldBegin("key", Thrift.Type.I32, 1);
            output.writeI32(this.key);
            output.writeFieldEnd();
        }
        if (this.value != null) {
            output.writeFieldBegin("value", Thrift.Type.STRING, 2);
            output.writeString(this.value);
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
                        this.key = value_1;
                    }
                    else {
                        input.skip(ftype);
                    }
                    break;
                case 2:
                    if (ftype === Thrift.Type.STRING) {
                        const value_2: string = input.readString();
                        this.value = value_2;
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
export namespace SharedService {
    export interface IGetStructArgsArgs {
        key: number;
    }
    export class GetStructArgs {
        public key: number;
        constructor(args?: IGetStructArgsArgs) {
            if (args != null) {
                if (args.key != null) {
                    this.key = args.key;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("GetStructArgs");
            if (this.key != null) {
                output.writeFieldBegin("key", Thrift.Type.I32, 1);
                output.writeI32(this.key);
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
                            const value_3: number = input.readI32();
                            this.key = value_3;
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
    export interface IGetStructResultArgs {
        success?: SharedStruct;
    }
    export class GetStructResult {
        public success: SharedStruct;
        constructor(args?: IGetStructResultArgs) {
            if (args != null) {
                if (args.success != null) {
                    this.success = args.success;
                }
            }
        }
        public write(output: TProtocol): void {
            output.writeStructBegin("GetStructResult");
            if (this.success != null) {
                output.writeFieldBegin("success", Thrift.Type.STRUCT, 0);
                this.success.write(output);
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
                        if (ftype === Thrift.Type.STRUCT) {
                            const value_4: SharedStruct = new SharedStruct();
                            value_4.read(input);
                            this.success = value_4;
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
    export class Client {
        public _seqid: number;
        public _reqs: {
            [name: number]: (err: Error | object | undefined, val?: any) => void;
        };
        public output: TTransport;
        public protocol: new (trans: TTransport) => TProtocol;
        constructor(output: TTransport, protocol: new (trans: TTransport) => TProtocol) {
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
        public getStruct(key: number): Promise<SharedStruct> {
            this._seqid = this.new_seqid();
            return new Promise<SharedStruct>((resolve, reject): void => {
                this._reqs[this.seqid()] = (error, result) => {
                    if (error != null) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
                this.send_getStruct(key);
            });
        }
        public send_getStruct(key: number): void {
            const output: TProtocol = new this.protocol(this.output);
            output.writeMessageBegin("getStruct", Thrift.MessageType.CALL, this.seqid());
            const args: GetStructArgs = new GetStructArgs({ key });
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        }
        public recv_getStruct(input: TProtocol, mtype: Thrift.MessageType, rseqid: number): void {
            const noop = (): any => null;
            const callback = this._reqs[rseqid] || noop;
            delete this._reqs[rseqid];
            if (mtype === Thrift.MessageType.EXCEPTION) {
                const x: Thrift.TApplicationException = new Thrift.TApplicationException();
                x.read(input);
                input.readMessageEnd();
                return callback(x);
            }
            const result = new GetStructResult();
            result.read(input);
            input.readMessageEnd();
            if (result.success != null) {
                return callback(undefined, result.success);
            }
            else {
                return callback(new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, "getStruct failed: unknown result"));
            }
        }
    }
    export interface IHandler<Context> {
        getStruct: (key: number, context: Context) => SharedStruct;
    }
    export class Processor<Context> {
        public _handler: IHandler<Context>;
        constructor(handler: IHandler<Context>) {
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
        public process_getStruct(seqid: number, input: TProtocol, output: TProtocol, context: Context): void {
            const args = new GetStructArgs();
            args.read(input);
            input.readMessageEnd();
            new Promise<SharedStruct>((resolve, reject): void => {
                try {
                    resolve(this._handler.getStruct(args.key, context));
                }
                catch (err) {
                    reject(err);
                }
            }).then((data: SharedStruct): void => {
                const result = new GetStructResult({ success: data });
                output.writeMessageBegin("getStruct", Thrift.MessageType.REPLY, seqid);
                result.write(output);
                output.writeMessageEnd();
                output.flush();
            }).catch((err: Error): void => {
                if (0 > 0) {
                }
                else {
                    const result: Thrift.TApplicationException = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin("getStruct", Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                    return;
                }
            });
        }
    }
}
