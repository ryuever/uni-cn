import { injectable } from '@/di';
import type { IFileSystemService } from './types';
import fsExtra from 'fs-extra';
import { promises as fs } from 'node:fs';

@injectable()
export class NodeFileSystem implements IFileSystemService {
  get promisifyFs() {
    return {
      readFile: fs.readFile.bind(fs),
      writeFile: fs.writeFile.bind(fs),
      mkdir: fs.mkdir.bind(fs),
      mkdtemp: fs.mkdtemp.bind(fs),
      cp: fs.cp.bind(fs),
      pathExists: fsExtra.pathExists.bind(fsExtra),
    };
  }

  get fsExtra() {
    return {
      existsSync: fsExtra.existsSync.bind(fsExtra),
      readJSONSync: (path: string, options?: { throws?: boolean }) =>
        fsExtra.readJsonSync(path, options),
    };
  }
}
