import * as fs from 'node:fs';
import { PackageJson } from './types';

export function fileExists(path: fs.PathLike): boolean {
  try {
    return fs.statSync(path).isFile();
  } catch {
    return false;
  }
}

export interface JsonSerializeOptions {
  spaces?: number;
}

export function serializeJson<T extends object = object>(
  input: T,
  options?: JsonSerializeOptions
): string {
  return JSON.stringify(input, null, options?.spaces ?? 2) + '\n';
}

export function readPackageJson(filePath: string): PackageJson {
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return JSON.parse(content);
}