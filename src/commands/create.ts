import { createId, inject, injectable } from '@/delightless-vue/di';
import { CreateTemplateFilesServiceId } from '@/delightless-vue/utils/updaters/create-template-files';
import type { CreateTemplateFilesService } from '@/delightless-vue/utils/updaters/create-template-files';

import { z } from 'zod';

import { Command } from 'commander';

export const createOptionsSchema = z.object({
  cwd: z.string(),
  template: z.string(),
  style: z.string(),
  name: z.string(),
});

export const CreateCommandServiceId = createId('create-command-service-id');
@injectable()
export class CreateCommandService {
  constructor(
    @inject(CreateTemplateFilesServiceId)
    private readonly createTemplateFilesService: CreateTemplateFilesService
  ) {}

  async runCreate(opts: z.infer<typeof createOptionsSchema>) {
    const options = createOptionsSchema.parse(opts);
    const cwd = options.cwd || process.cwd();
    await this.createTemplateFilesService.createTemplateFiles(cwd, options);
  }
}

export const create = new Command()
  .name('create')
  .description('create new project with a template')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .option('-t, --template <template>', 'the template to use.', 'default')
  .option('-s, --style <style>', 'the style to install.', 'default')
  .option('-n, --name <name>', 'the name of the project.', 'my-project')
  .action(async (opts: z.infer<typeof createOptionsSchema>) => {});
