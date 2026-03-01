import type { createOptionsSchema } from '@/commands/create';
import { createId, inject, injectable } from '@x-oasis/di';
import { getRegistryTemplates } from '@/registry/api';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';

import type { z } from 'zod';

import path from 'pathe'

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


    if (!templateFile) {
      throw new Error(`>>>>>>>> Template ${template} not found`);
    }

    const templateFiles = templateFile.files;


    for (const file of templateFiles) {
      try {
        const filePathParts = file.path.split('/');
        // 删除 templates
        filePathParts.shift();
        // 删除 templateName
        filePathParts.shift();


        const filePath = path.join(cwd, projectName, filePathParts.join('/'));
        const targetDir = path.dirname(filePath);


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
