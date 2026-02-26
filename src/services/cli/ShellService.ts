import { inject, injectable } from '@/delightless-vue/di';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import type { IFileSystemService } from '@/delightless-vue/services/file-system/types';

@injectable()
export class ShellService {
  constructor(
    // @ts-expect-error - TypeScript limitation with parameter decorators
    @inject(FileSystemServiceId) private readonly fs: IFileSystemService
  ) {}

  init() {
    console.log('this ', this.fs);
  }
}
