import { createId, inject, injectable } from '@/delightless-vue/di';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import type { IFileSystemService } from '@/delightless-vue/services/file-system/types';

import path from 'pathe';

// import fs from 'fs-extra';
import type { PackageJson } from 'type-fest';

export const GetPackageInfoServiceId = createId('get-package-info-service-id');

@injectable()
export class GetPackageInfoService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService
  ) {}

  async getPackageInfo(cwd: string = '', shouldThrow: boolean = true) {
    const packageJsonPath = path.join(cwd, 'package.json');

    return this.fileSystemService.fsExtra.readJSONSync(packageJsonPath, {
      throws: shouldThrow,
    }) as PackageJson;
  }
}

// export function getPackageInfo(
//   cwd: string = '',
//   shouldThrow: boolean = true
// ): PackageJson | null {
//   const packageJsonPath = path.join(cwd, 'package.json');

//   return fs.readJSONSync(packageJsonPath, {
//     throws: shouldThrow,
//   }) as PackageJson;
// }
