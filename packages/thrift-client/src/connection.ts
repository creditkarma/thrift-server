import {
  TBinaryProtocol,
  TBufferedTransport,
  TTransport,
  TProtocol,
  Thrift,
  TMessage,
} from 'thrift'

import { AxiosInstance, AxiosResponse } from 'axios'
import * as request from 'request'

const InputBufferUnderrunError: any = require('thrift/lib/nodejs/lib/thrift/input_buffer_underrun_error')

const noop = (): void => {};

export interface HttpConnectionOptions {
  hostName: string;
  port: number;
}

export type RequestClientApi =
  request.RequestAPI<request.Request, object, object>

export interface HttpConnection {
  write(dataToWrite: Buffer, seqid: number): Promise<Buffer>;
}

export class AxiosConnection implements HttpConnection {
  private _request: AxiosInstance;
  constructor(requestApi: AxiosInstance, options: HttpConnectionOptions) {
    this._request = requestApi;
    this._request.defaults.responseType = 'arraybuffer';
    this._request.defaults.baseURL = `http://${options.hostName}:${options.port}`;
  }

  write(dataToWrite: Buffer, seqid: number): Promise<Buffer> {
    return this._request.post('/', dataToWrite).then((value: AxiosResponse) => {
      return Buffer.from(value.data);
    })
  }
}

export function createAxiosConnection(requestApi: AxiosInstance, options: HttpConnectionOptions): HttpConnection {
  return new AxiosConnection(requestApi, options);
}

export class RequestConnection implements HttpConnection {
  private _request: RequestClientApi;
  constructor(requestApi: RequestClientApi, options: HttpConnectionOptions) {
    this._request = requestApi.defaults({
      url: `http://${options.hostName}:${options.port}`,
      headers: {
        'Connection': 'keep-alive',
      }
    });
  }

  write(dataToWrite: Buffer, seqid: number): Promise<Buffer> {
    let combinedBufferLength: number = 0;
    let responseData: Array<Buffer> = [];
    return new Promise((resolve, reject) => {
      this._request
        .post({
          headers: {
            'Content-length': dataToWrite.length
          },
          body: dataToWrite
        })
        .on('data', (chunk: Buffer | string): void => {
          if (typeof chunk === 'string') {
            responseData.push(new Buffer(chunk));
          } else if (Object.prototype.toString.call(chunk) === '[object Uint8Array]') {
            responseData.push(new Buffer(chunk));
          } else {
            responseData.push(chunk);
          }

          combinedBufferLength += chunk.length;
        })
        .on('end', (end: any): void => {
          const buf: Buffer = new Buffer(combinedBufferLength);
          const len: number = responseData.length;
          let pos: number = 0;
          for (let i = 0; i < len; i++) {
            responseData[i].copy(buf, pos);
            pos += responseData[i].length;
          }

          resolve(buf);
        })
        .on('error', (err: any): void => {
          reject(err);
        })
    })
  }
}

export function createConnection(requestApi: RequestClientApi, options: HttpConnectionOptions): HttpConnection {
  return new RequestConnection(requestApi, options);
}
