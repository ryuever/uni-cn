import { inject, injectable } from '@/delightless-vue/di';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import type { IFileSystemService } from '@/delightless-vue/services/file-system/types';

@injectable()
export class NodeModuleService {
  constructor(
    @inject(FileSystemServiceId) private readonly fs: IFileSystemService
  ) {}
}
