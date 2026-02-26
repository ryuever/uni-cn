import type { createOptionsSchema } from '@/delightless-vue/commands/create';
import { createId, inject, injectable } from '@/delightless-vue/di';
import { getRegistryTemplates } from '@/delightless-vue/registry/api';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import type { IFileSystemService } from '@/delightless-vue/services/file-system/types';

import type { z } from 'zod';

import * as path from 'path'

export const CreateTemplateFilesServiceId = createId(
  'create-template-files-service-id'
);
@injectable()
export class CreateTemplateFilesService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService
  ) {}

  async createTemplateFiles(
    cwd: string,
    options: z.infer<typeof createOptionsSchema>
  ) {
    const template = options.template;
    const style = options.style;
    const projectName = options.name;

    const templateFile = await getRegistryTemplates(template, style);

    console.log('>>>>>> templateFile ', !!templateFile)

    if (!templateFile) {
      throw new Error(`>>>>>>>> Template ${template} not found`);
    }

    const templateFiles = templateFile.files;

    console.log('>>>>>> templateFiles ', templateFiles)

    for (const file of templateFiles) {
      try {
        const filePathParts = file.path.split('/');
        // 删除 templates
        filePathParts.shift();
        // 删除 templateName
        filePathParts.shift();

        console.log('>>>>>> file ', this.fileSystemService, this.fileSystemService.promisifyFs, path, file?.path, filePathParts,)

        const filePath = path.join(cwd, projectName, filePathParts.join('/'));
        const targetDir = path.dirname(filePath);

        console.log('>>>>>> filepath ', filePath)

        await this.fileSystemService.promisifyFs.mkdir(targetDir, {
          recursive: true,
        });
        await this.fileSystemService.promisifyFs.writeFile(
          filePath,
          file.content
        );
      } catch (error) {
        console.error('>>>>>> error ', error)
      }
    }
  }
}
