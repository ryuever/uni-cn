import { inject, injectable } from '@x-oasis/di';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';

@injectable()
export class NodeModuleService {
  constructor(
    @inject(FileSystemServiceId) private readonly fs: IFileSystemService
  ) {}
}
