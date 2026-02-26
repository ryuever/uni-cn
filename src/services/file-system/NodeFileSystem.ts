import { injectable } from '@/delightless-vue/di';

import fsExtra from 'fs-extra';
import { promises as fs } from 'node:fs';

@injectable()
export class FileSystemService {
  get promisifyFs() {
    return fs;
  }

  get fsExtra() {
    return fsExtra;
  }
}
