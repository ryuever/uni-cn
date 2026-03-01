import * as ERRORS from '@/utils/errors';
import { addServiceModules } from '@/commands/addService';
import { Container, createId, inject, injectable } from '@x-oasis/di';
import {
  getRegistryIndex,
  getRegistryItem,
  isUrl,
} from '@/registry/api';
import { handleError } from '@/utils/handle-error';
import { exitOrThrow } from '@/utils/exit';
import { highlighter } from '@/utils/highlighter';
import { logger } from '@/utils/logger';

import { z } from 'zod';

import path from 'pathe';

import { Command } from 'commander';
import prompts from 'prompts';

import type { PreFlightAddService } from '../preflights/preflight-add';
import { PreFlightAddServiceId } from '../preflights/preflight-add';
import type { registryItemTypeSchema } from '../registry';
import type { AddComponentsService } from '../utils/add-components';
import { AddComponentsServiceId } from '../utils/add-components';
import type { GetProjectInfoService } from '../utils/get-project-info';
import { GetProjectInfoServiceId } from '../utils/get-project-info';
import type { InitCommandService } from './init';
import { InitCommandServiceId } from './init';
import { IExitServiceId, ICwdServiceId } from '@/services/env';
import type { IExitService, ICwdService } from '@/services/env';
import type { CreateTemplateFilesService } from '@/utils/updaters/create-template-files';
import { CreateTemplateFilesServiceId } from '@/utils/updaters/create-template-files';

const DEPRECATED_COMPONENTS = [
  {
    name: 'toast',
    deprecatedBy: 'sonner',
    message:
      'The toast component is deprecated. Use the sonner component instead.',
  },
  {
    name: 'toaster',
    deprecatedBy: 'sonner',
    message:
      'The toaster component is deprecated. Use the sonner component instead.',
  },
];

export const addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
  silent: z.boolean(),
  srcDir: z.boolean().optional(),
  cssVariables: z.boolean(),
  /** When true, skip npm install. For memfs. */
  skipDependenciesInstall: z.boolean().optional(),
});

export const add = new Command()
  .name('add')
  .description('add a component or template to your project')
  .argument(
    '[components...]',
    'the components to add, a url, or "template <name>" to scaffold from a template.'
  )
  .option('-y, --yes', 'skip confirmation prompt.', false)
  .option('-o, --overwrite', 'overwrite existing files.', false)
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .option('-a, --all', 'add all available components', false)
  .option('-p, --path <path>', 'the path to add the component to.')
  .option('-s, --silent', 'mute output.', false)
  .option('-n, --name <name>', 'project name (used with template).', 'my-project')
  .option('--style <style>', 'template style.', 'default')
  .option('--css-variables', 'use css variables for theming.', true)
  .option('--no-css-variables', 'do not use css variables for theming.')
  .action(async (components, opts) => {
    try {
      const container = new Container();
      container.load(addServiceModules);
      const addService: AddCommandService = container.get(AddCommandServiceId);

      // `add template [name]` — download template files as-is
      if (components?.[0] === 'template') {
        const templateName = components[1] ?? 'default';
        await addService.runAddTemplate({
          cwd: path.resolve(opts.cwd),
          template: templateName,
          style: opts.style ?? 'default',
          name: opts.name ?? 'my-project',
        });
        return;
      }

      const options = addOptionsSchema.parse({
        components: components ?? [],
        cwd: path.resolve(opts.cwd),
        yes: opts.yes,
        overwrite: opts.overwrite,
        all: opts.all,
        path: opts.path,
        silent: opts.silent,
        srcDir: opts.srcDir,
        cssVariables: opts.cssVariables,
      });
      await addService.runAdd(options.components ?? [], options);
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export const AddCommandServiceId = createId('add-command-service-id');
@injectable()
export class AddCommandService {
  constructor(
    @inject(AddComponentsServiceId)
    private readonly addComponentsService: AddComponentsService,
    @inject(GetProjectInfoServiceId)
    private readonly getProjectInfoService: GetProjectInfoService,
    @inject(PreFlightAddServiceId)
    private readonly preFlightAddService: PreFlightAddService,
    @inject(InitCommandServiceId)
    private readonly initCommandService: InitCommandService,
    @inject(IExitServiceId)
    private readonly exitService: IExitService,
    @inject(CreateTemplateFilesServiceId)
    private readonly createTemplateFilesService: CreateTemplateFilesService,
    @inject(ICwdServiceId)
    private readonly cwdService: ICwdService
  ) {}

  async runAdd(components: string[], opts: z.infer<typeof addOptionsSchema>) {
    try {
      const options = addOptionsSchema.parse({
        ...opts,
        components,
        cwd: path.resolve(opts.cwd),
      });

      let itemType: z.infer<typeof registryItemTypeSchema> | undefined;

      if (components.length > 0 && isUrl(components[0])) {
        const item = await getRegistryItem(components[0], '');
        itemType = item?.type;
      }

      if (
        !options.yes &&
        (itemType === 'registry:style' || itemType === 'registry:theme')
      ) {
        logger.break();
        const { confirm } = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: highlighter.warn(
            `You are about to install a new ${itemType.replace(
              'registry:',
              ''
            )}. \nExisting CSS variables and components will be overwritten. Continue?`
          ),
        });
        if (!confirm) {
          logger.break();
          logger.log(`Installation cancelled.`);
          logger.break();
          this.exitService.exit(1);
        }
      }

      if (!options.components?.length) {
        options.components = await promptForRegistryComponents(options);
      }

      const projectInfo = await this.getProjectInfoService.getProjectInfo(
        options.cwd
      );
      if (projectInfo?.tailwindVersion === 'v4') {
        const deprecatedComponents = DEPRECATED_COMPONENTS.filter((component) =>
          options.components?.includes(component.name)
        );

        if (deprecatedComponents?.length) {
          logger.break();
          deprecatedComponents.forEach((component) => {
            logger.warn(highlighter.warn(component.message));
          });
          logger.break();
          this.exitService.exit(1);
        }
      }

      let { errors, config } =
        await this.preFlightAddService.preFlightAdd(options);

      // No components.json file. Prompt the user to run init.
      if (errors[ERRORS.MISSING_CONFIG]) {
        const { proceed } = await prompts({
          type: 'confirm',
          name: 'proceed',
          message: `You need to create a ${highlighter.info(
            'components.json'
          )} file to add components. Proceed?`,
          initial: true,
        });

        if (!proceed) {
          logger.break();
          this.exitService.exit(1);
        }

        config = await this.initCommandService.runInit({
          cwd: options.cwd,
          yes: true,
          force: true,
          defaults: false,
          skipPreflight: false,
          silent: true,
          isNewProject: false,
          srcDir: options.srcDir,
          cssVariables: options.cssVariables,
          style: 'index',
        });
      }

      if (!config) {
        throw new Error(
          `Failed to read config at ${highlighter.info(options.cwd)}.`
        );
      }

      await this.addComponentsService.addComponents(
        options.components,
        config,
        options
      );
    } catch (error) {
      logger.break();
      handleError(error);
    }
  }

  /**
   * Download a template from registry and write files as-is (no transforms).
   * This is the `add template <name>` entry point.
   */
  async runAddTemplate(options: {
    cwd?: string;
    template?: string;
    style?: string;
    name?: string;
  } = {}) {
    const cwd = options.cwd || this.cwdService.cwd();
    await this.createTemplateFilesService.createTemplateFiles(cwd, {
      cwd,
      template: options.template ?? 'default',
      style: options.style ?? 'default',
      name: options.name ?? 'my-project',
    });
  }
}

async function promptForRegistryComponents(
  options: z.infer<typeof addOptionsSchema>
) {
  const registryIndex = await getRegistryIndex();

  if (!registryIndex) {
    logger.break();
    handleError(new Error('Failed to fetch registry index.'));
    return [];
  }

  if (options.all) {
    return registryIndex
      .map((entry) => entry.name)
      .filter(
        (component) => !DEPRECATED_COMPONENTS.some((c) => c.name === component)
      );
  }

  if (options.components?.length) {
    return options.components;
  }

  const { components } = await prompts({
    type: 'multiselect',
    name: 'components',
    message: 'Which components would you like to add?',
    hint: 'Space to select. A to toggle all. Enter to submit.',
    instructions: false,
    choices: registryIndex
      .filter(
        (entry) =>
          entry.type === 'registry:ui' &&
          !DEPRECATED_COMPONENTS.some(
            (component) => component.name === entry.name
          )
      )
      .map((entry) => ({
        title: entry.name,
        value: entry.name,
        selected: options.all ? true : options.components?.includes(entry.name),
      })),
  });

  if (!components?.length) {
    logger.warn('No components selected. Exiting.');
    logger.info('');
    exitOrThrow(1);
  }

  const result = z.array(z.string()).safeParse(components);
  if (!result.success) {
    logger.error('');
    handleError(new Error('Something went wrong. Please try again.'));
    return [];
  }
  return result.data;
}
