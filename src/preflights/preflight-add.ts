import * as ERRORS from '@/utils/errors';
import type { addOptionsSchema } from '@/commands/add';
import { createId, inject, injectable } from '@/di';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';
import { getConfig } from '@/utils/get-config';
import { highlighter } from '@/utils/highlighter';
import { logger } from '@/utils/logger';

import type { z } from 'zod';

import path from 'pathe';

export const PreFlightAddServiceId = createId('pre-flight-add-service-id');

@injectable()
export class PreFlightAddService {
  constructor(
    @inject(FileSystemServiceId) private fileSystemService: IFileSystemService
  ) {}

  async preFlightAdd(options: z.infer<typeof addOptionsSchema>) {
    const errors: Record<string, boolean> = {};

    // Ensure target directory exists.
    // Check for empty project. We assume if no package.json exists, the project is empty.
    if (
      !this.fileSystemService.fsExtra.existsSync(options.cwd) ||
      !this.fileSystemService.fsExtra.existsSync(
        path.resolve(options.cwd, 'package.json')
      )
    ) {
      errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true;
      return {
        errors,
        config: null,
      };
    }

    // Check for existing components.json file.
    if (
      !this.fileSystemService.fsExtra.existsSync(
        path.resolve(options.cwd, 'components.json')
      )
    ) {
      errors[ERRORS.MISSING_CONFIG] = true;
      return {
        errors,
        config: null,
      };
    }

    try {
      const config = await getConfig(options.cwd);

      return {
        errors,
        config: config!,
      };
    } catch {
      logger.break();
      logger.error(
        `An invalid ${highlighter.info(
          'components.json'
        )} file was found at ${highlighter.info(
          options.cwd
        )}.\nBefore you can add components, you must create a valid ${highlighter.info(
          'components.json'
        )} file by running the ${highlighter.info('init')} command.`
      );
      logger.error(
        `Learn more at ${highlighter.info(
          'https://shadcn-vue.com/docs/components-json'
        )}.`
      );
      logger.break();
      process.exit(1);
    }
  }
}
