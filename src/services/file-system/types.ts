import type { PathLike } from 'node:fs';

/** Promise-based fs operations (Node fs.promises + pathExists from fs-extra) */
export interface IPromisifiedFs {
  readFile(
    path: PathLike,
    options?: { encoding?: BufferEncoding } | BufferEncoding
  ): Promise<string | Buffer>;
  writeFile(
    path: PathLike,
    data: string | Buffer,
    options?: { encoding?: BufferEncoding } | BufferEncoding
  ): Promise<void>;
  mkdir(path: PathLike, options?: { recursive?: boolean }): Promise<string>;
  mkdtemp(prefix: string): Promise<string>;
  cp(
    src: PathLike,
    dest: PathLike,
    options?: { recursive?: boolean }
  ): Promise<void>;
  pathExists(path: PathLike): Promise<boolean>;
}

/** Sync fs operations */
export interface IFsExtra {
  existsSync(path: PathLike): boolean;
  readJSONSync(
    path: PathLike,
    options?: { encoding?: BufferEncoding; throws?: boolean }
  ): any;
}

export type IFileSystemService = {
  promisifyFs: IPromisifiedFs;
  fsExtra: IFsExtra;
};
