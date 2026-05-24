import type { PathLike } from 'node:fs';

/** Promise-based fs operations (Node fs.promises + pathExists from fs-extra) */
export interface IPromisifiedFs {
  readFile(
    path: PathLike,
    options: { encoding: BufferEncoding } | BufferEncoding
  ): Promise<string>;
  readFile(
    path: PathLike,
    options?: { encoding?: null } | null
  ): Promise<Buffer>;
  readFile(
    path: PathLike,
    options?: { encoding?: BufferEncoding | null } | BufferEncoding | null
  ): Promise<string | Buffer>;
  writeFile(
    path: PathLike,
    data: string | Buffer | Uint8Array,
    options?: { encoding?: BufferEncoding | null } | BufferEncoding | null
  ): Promise<void>;
  mkdir(path: PathLike, options?: { recursive?: boolean }): Promise<string | undefined>;
  mkdtemp(prefix: string): Promise<string>;
  cp(
    src: PathLike,
    dest: PathLike,
    options?: {
      recursive?: boolean;
      filter?: (src: string, dest: string) => boolean | Promise<boolean>;
    }
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
