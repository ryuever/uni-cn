import { createId, inject, injectable } from '@x-oasis/di';
import { ICwdServiceId } from '@/services/env';
import type { ICwdService } from '@/services/env';
import { CreateTemplateFilesServiceId } from '@/utils/updaters/create-template-files';
import type { CreateTemplateFilesService } from '@/utils/updaters/create-template-files';

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
    private readonly createTemplateFilesService: CreateTemplateFilesService,
    @inject(ICwdServiceId)
    private readonly cwdService: ICwdService
  ) {}

  async runCreate(opts: z.infer<typeof createOptionsSchema>) {
    const options = createOptionsSchema.parse(opts);
    const cwd = options.cwd || this.cwdService.cwd();
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
