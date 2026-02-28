import { injectable } from '@x-oasis/di';
import type { IFileSystemService } from './types';
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

  get promisifyFs() {
    const vol = this.vol;
    return {
      readFile: vol.promises.readFile.bind(vol.promises),
      writeFile: vol.promises.writeFile.bind(vol.promises),
      mkdir: vol.promises.mkdir.bind(vol.promises),
      mkdtemp: vol.promises.mkdtemp.bind(vol.promises),
      cp: vol.promises.cp.bind(vol.promises),
      pathExists: async (path: string) => {
        try {
          await vol.promises.access(path);
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  get fsExtra() {
    const vol = this.vol;
    return {
      existsSync: (path: string) => {
        try {
          vol.accessSync(path);
          return true;
        } catch {
          return false;
        }
      },
      readJSONSync: (path: string, options?: { throws?: boolean }) => {
        try {
          const content = vol.readFileSync(path, 'utf-8');
          return JSON.parse(content);
        } catch (e) {
          if (options?.throws !== false) throw e;
          return undefined;
        }
      },
    };
  }
}
