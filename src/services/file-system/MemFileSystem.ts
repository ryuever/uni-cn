import { injectable } from '@x-oasis/di';
import type { PathLike } from 'node:fs';
import type { IFsExtra, IFileSystemService, IPromisifiedFs } from './types';
import { Volume } from 'memfs';

/**
 * In-memory filesystem using memfs. Use for testing or non-Node environments.
 * Pass a Volume instance to the constructor or use the default empty volume.
 */
@injectable()
export class MemFileSystem implements IFileSystemService {
  private readonly vol: Volume;

  constructor(volume?: Volume) {
    this.vol = volume ?? new Volume();
  }

  /** Get the underlying Volume for setup/assertions (e.g. vol.toJSON()) */
  get volume(): Volume {
    return this.vol;
  }

  get promisifyFs(): IPromisifiedFs {
    const vol = this.vol;
    const promisifyFs = {
      readFile: (path: PathLike, options?: unknown) =>
        vol.promises.readFile(String(path), options as never) as Promise<
          string | Buffer
        >,
      writeFile: async (path: PathLike, data: string | Buffer | Uint8Array, options?: unknown) => {
        await vol.promises.writeFile(
          String(path),
          data as never,
          options as never
        );
      },
      mkdir: (path: PathLike, options?: unknown) =>
        vol.promises.mkdir(String(path), options as never) as Promise<
          string | undefined
        >,
      mkdtemp: (prefix: string) =>
        vol.promises.mkdtemp(prefix) as Promise<string>,
      cp: async (src: PathLike, dest: PathLike, options?: unknown) => {
        await vol.promises.cp(String(src), String(dest), options as never);
      },
      pathExists: async (path: PathLike) => {
        try {
          await vol.promises.access(String(path));
          return true;
        } catch {
          return false;
        }
      },
    };
    return promisifyFs as unknown as IPromisifiedFs;
  }

  get fsExtra(): IFsExtra {
    const vol = this.vol;
    return {
      existsSync: (path: PathLike) => {
        try {
          vol.accessSync(String(path));
          return true;
        } catch {
          return false;
        }
      },
      readJSONSync: (path: PathLike, options?: { throws?: boolean }) => {
        try {
          const content = vol.readFileSync(String(path), 'utf-8');
          return JSON.parse(String(content));
        } catch (e) {
          if (options?.throws !== false) throw e;
          return undefined;
        }
      },
    };
  }
}
