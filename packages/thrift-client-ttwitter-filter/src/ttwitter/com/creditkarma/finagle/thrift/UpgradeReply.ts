/* tslint:disable */
/* eslint-disable */
/*
 * Autogenerated by @creditkarma/thrift-typescript v3.7.6
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
*/
import * as thrift from "@creditkarma/thrift-server-core";
export interface IUpgradeReply {
}
export interface IUpgradeReplyArgs {
}
export const UpgradeReplyCodec: thrift.IStructCodec<IUpgradeReplyArgs, IUpgradeReply> = {
    encode(args: IUpgradeReplyArgs, output: thrift.TProtocol): void {
        output.writeStructBegin("UpgradeReply");
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    },
    decode(input: thrift.TProtocol): IUpgradeReply {
        input.readStructBegin();
        while (true) {
            const ret: thrift.IThriftField = input.readFieldBegin();
            const fieldType: thrift.TType = ret.fieldType;
            const fieldId: number = ret.fieldId;
            if (fieldType === thrift.TType.STOP) {
                break;
            }
            switch (fieldId) {
                default: {
                    input.skip(fieldType);
                }
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return {};
    }
};
export class UpgradeReply extends thrift.StructLike implements IUpgradeReply {
    public readonly _annotations: thrift.IThriftAnnotations = {};
    public readonly _fieldAnnotations: thrift.IFieldAnnotations = {};
    constructor(args: IUpgradeReplyArgs = {}) {
        super();
    }
    public static read(input: thrift.TProtocol): UpgradeReply {
        return new UpgradeReply(UpgradeReplyCodec.decode(input));
    }
    public static write(args: IUpgradeReplyArgs, output: thrift.TProtocol): void {
        return UpgradeReplyCodec.encode(args, output);
    }
    public write(output: thrift.TProtocol): void {
        return UpgradeReplyCodec.encode(this, output);
    }
}
