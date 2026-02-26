import { inject, injectable } from '@/di';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';

@injectable()
export class ShellService {
  constructor(
    // @ts-expect-error - TypeScript limitation with parameter decorators
    @inject(FileSystemServiceId) private readonly fs: IFileSystemService
  ) {}

  init() {
  }
}
