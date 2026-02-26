import { injectable } from '@/delightless-vue/di';

import { FileSystemServiceId } from './constants';

@injectable()
export class MemFileSystem {
  get(property: string) {
    return fs[property];
  }
}
