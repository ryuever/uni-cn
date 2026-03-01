import * as ERRORS from '@/utils/errors';
import {
  Container,
  createId,
  inject,
  injectable,
} from '@x-oasis/di';
import type { PreFlightInitService } from '@/preflights/preflight-init';
import { PreFlightInitServiceId } from '@/preflights/preflight-init';
import {
  BASE_COLORS,
  getRegistryBaseColors,
  getRegistryItem,
  getRegistryStyles,
  isUrl,
} from '@/registry/api';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';
import { IExitServiceId } from '@/services/env';
import type { IExitService } from '@/services/env';
import { AddComponentsServiceId } from '@/utils/add-components';
import type { AddComponentsService } from '@/utils/add-components';
import type { Config, RawConfig } from '@/utils/get-config';
import {
  DEFAULT_COMPONENTS,
  DEFAULT_TAILWIND_CONFIG,
  DEFAULT_TAILWIND_CSS,
  DEFAULT_UTILS,
  getConfig,
  rawConfigSchema,
  resolveConfigPaths,
} from '@/utils/get-config';
import type {
  GetProjectConfigService,
  GetProjectInfoService,
  GetProjectTailwindVersionFromConfigService,
} from '@/utils/get-project-info';
import {
  GetProjectConfigServiceId,
  GetProjectInfoServiceId,
  GetProjectTailwindVersionFromConfigServiceId,
} from '@/utils/get-project-info';
import { initServiceModules } from '@/commands/initService';
import { handleError } from '@/utils/handle-error';
import { highlighter } from '@/utils/highlighter';
import { logger } from '@/utils/logger';
import { spinner } from '@/utils/spinner';
import type { UpdateTailwindContentService } from '@/utils/updaters/update-tailwind-content';
import { UpdateTailwindContentServiceId } from '@/utils/updaters/update-tailwind-content';

import { z } from 'zod';

import path from 'pathe';

import { Command } from 'commander';
import prompts from 'prompts';

export const initOptionsSchema = z.object({
  cwd: z.string(),
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  defaults: z.boolean(),
  force: z.boolean(),
  silent: z.boolean(),
  isNewProject: z.boolean(),
  srcDir: z.boolean().optional(),
  cssVariables: z.boolean(),
  baseColor: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val) {
          return BASE_COLORS.find((color) => color.name === val);
        }

        return true;
      },
      {
        message: `Invalid base color. Please use '${BASE_COLORS.map(
          (color) => color.name
        ).join("', '")}'`,
      }
    ),
  style: z.string(),
  /** When provided, skip getProjectConfig/getConfig. Use resolvedPaths if present to skip resolveConfigPaths (for memfs). */
  config: z.custom<RawConfig | Config>().optional(),
  /** When true, skip updateDependencies (npm install). Use for memfs where execa cannot run. */
  skipDependenciesInstall: z.boolean().optional(),
  /** When true, skip addComponents entirely. Use when getTSConfig/updateFiles cannot run (e.g. memfs without Node fs for tsconfig). */
  skipAddComponents: z.boolean().optional(),
});

export const PromptForMinimalConfigServiceId = createId(
  'prompt-for-minimal-config-service-id'
);

export const InitCommandServiceId = createId('init-command-service-id');
@injectable()
export class InitCommandService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(PreFlightInitServiceId)
    private readonly preFlightInitService: PreFlightInitService,
    @inject(AddComponentsServiceId)
    private readonly addComponentsService: AddComponentsService,
    @inject(GetProjectInfoServiceId)
    private readonly getProjectInfoService: GetProjectInfoService,
    @inject(GetProjectConfigServiceId)
    private readonly getProjectConfigService: GetProjectConfigService,
    @inject(PromptForMinimalConfigServiceId)
    private readonly promptForMinimalConfigService: PromptForMinimalConfigService,
    @inject(UpdateTailwindContentServiceId)
    private readonly updateTailwindContentService: UpdateTailwindContentService,
    @inject(IExitServiceId)
    private readonly exitService: IExitService
  ) {}

  async runInit(
    options: z.infer<typeof initOptionsSchema> & {
      skipPreflight?: boolean;
    }
  ) {
    let projectInfo;
    if (options.config) {
      projectInfo = null;
    } else if (!options.skipPreflight) {
      const preflight = await this.preFlightInitService.preFlightInit(options);
      if (preflight.errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT]) {
        this.exitService.exit(1);
      }
      projectInfo = preflight.projectInfo;
    } else {
      projectInfo = await this.getProjectInfoService.getProjectInfo(
        options.cwd
      );
    }

    const config = options.config ?? (
      await (async () => {
        const projectConfig = await this.getProjectConfigService.getProjectConfig(
          options.cwd,
          projectInfo
        );
        return projectConfig
          ? await this.promptForMinimalConfigService.promptForMinimalConfig(
              projectConfig,
              options
            )
          : await promptForConfig(await getConfig(options.cwd));
      })()
    );

    if (!options.yes) {
      const { proceed } = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Write configuration to ${highlighter.info(
          'components.json'
        )}. Proceed?`,
        initial: true,
      });

      if (!proceed) {
        this.exitService.exit(0);
      }
    }

    // Write components.json.
    const componentSpinner = spinner(`Writing components.json.`, {
      silent: options.silent,
    }).start();
    const targetPath = path.resolve(options.cwd, 'components.json');
    await this.fileSystemService.promisifyFs.writeFile(
      targetPath,
      JSON.stringify(config, null, 2),
      'utf8'
    );
    componentSpinner?.succeed();

    if (options.skipAddComponents) {
      return ('resolvedPaths' in config ? config : { ...config, resolvedPaths: {} }) as Config;
    }

    // Add components.
    const fullConfig =
      config && 'resolvedPaths' in config && config.resolvedPaths?.cwd
        ? (config as Config)
        : await resolveConfigPaths(options.cwd, config as RawConfig);
    const components = [
      ...(options.style === 'none' ? [] : [options.style]),
      ...(options.components ?? []),
    ];
    await this.addComponentsService.addComponents(components, fullConfig, {
      // Init will always overwrite files.
      overwrite: true,
      silent: options.silent,
      style: options.style,
      isNewProject:
        options.isNewProject || projectInfo?.framework.name === 'nuxt',
      skipDependenciesInstall: options.skipDependenciesInstall,
    });

    // If a new project is using src dir, let's update the tailwind content config.
    // TODO: Handle this per framework.
    if (options.isNewProject && options.srcDir) {
      await this.updateTailwindContentService.updateTailwindContent(
        ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
        fullConfig,
        {
          silent: options.silent,
        }
      );
    }

    return fullConfig;
  }
}
export const init = new Command()
  .name('init')
  .description('initialize your project and install dependencies')
  .argument(
    '[components...]',
    'the components to add or a url to the component.'
  )
  .option('-y, --yes', 'skip confirmation prompt.', true)
  .option('-d, --defaults,', 'use default configuration.', false)
  .option('-f, --force', 'force overwrite of existing configuration.', false)
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .option('-s, --silent', 'mute output.', false)
  // .option(
  //   '--src-dir',
  //   'use the src directory when creating a new project.',
  //   false,
  // )
  .option('--css-variables', 'use css variables for theming.', true)
  .option('--no-css-variables', 'do not use css variables for theming.')
  .action(async (components, opts) => {
    try {
      const options = initOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        isNewProject: false,
        components,
        style: 'index',
        ...opts,
      });

      // We need to check if we're initializing with a new style.
      // We fetch the payload of the first item.
      // This is okay since the request is cached and deduped.
      if (components.length > 0 && isUrl(components[0])) {
        const item = await getRegistryItem(components[0], '');

        // Skip base color if style.
        // We set a default and let the style override it.
        if (item?.type === 'registry:style') {
          options.baseColor = 'neutral';
          options.style = item.extends ?? 'index';
        }
      }

      // await runInit(options);

      const container = new Container();
      container.load(initServiceModules);
      const runInitService = container.get(InitCommandServiceId);
      await runInitService.runInit(options);

      logger.log(
        `${highlighter.success(
          'Success!'
        )} Project initialization completed.\nYou may now add components.`
      );
      logger.break();
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

async function promptForConfig(defaultConfig: Config | null = null) {
  const [styles, baseColors] = await Promise.all([
    getRegistryStyles(),
    getRegistryBaseColors(),
  ]);

  logger.info('');
  const options = await prompts([
    {
      type: 'toggle',
      name: 'typescript',
      message: `Would you like to use ${highlighter.info(
        'TypeScript'
      )} (recommended)?`,
      initial: defaultConfig?.typescript ?? true,
      active: 'yes',
      inactive: 'no',
    },
    {
      type: 'select',
      name: 'style',
      message: `Which ${highlighter.info('style')} would you like to use?`,
      choices: styles.map((style) => ({
        title:
          style.name === 'new-york' ? 'New York (Recommended)' : style.label,
        value: style.name,
      })),
    },
    {
      type: 'select',
      name: 'tailwindBaseColor',
      message: `Which color would you like to use as the ${highlighter.info(
        'base color'
      )}?`,
      choices: baseColors.map((color) => ({
        title: color.label,
        value: color.name,
      })),
    },
    {
      type: 'text',
      name: 'tailwindCss',
      message: `Where is your ${highlighter.info('global CSS')} file?`,
      initial: defaultConfig?.tailwind.css ?? DEFAULT_TAILWIND_CSS,
    },
    {
      type: 'toggle',
      name: 'tailwindCssVariables',
      message: `Would you like to use ${highlighter.info(
        'CSS variables'
      )} for theming?`,
      initial: defaultConfig?.tailwind.cssVariables ?? true,
      active: 'yes',
      inactive: 'no',
    },
    {
      type: 'text',
      name: 'tailwindPrefix',
      message: `Are you using a custom ${highlighter.info(
        'tailwind prefix eg. tw-'
      )}? (Leave blank if not)`,
      initial: '',
    },
    {
      type: 'text',
      name: 'tailwindConfig',
      message: `Where is your ${highlighter.info(
        'tailwind.config.js'
      )} located?`,
      initial: defaultConfig?.tailwind.config ?? DEFAULT_TAILWIND_CONFIG,
    },
    {
      type: 'text',
      name: 'components',
      message: `Configure the import alias for ${highlighter.info(
        'components'
      )}:`,
      initial: defaultConfig?.aliases.components ?? DEFAULT_COMPONENTS,
    },
    {
      type: 'text',
      name: 'utils',
      message: `Configure the import alias for ${highlighter.info('utils')}:`,
      initial: defaultConfig?.aliases.utils ?? DEFAULT_UTILS,
    },
  ]);

  return rawConfigSchema.parse({
    $schema: 'https://ui.shadcn.com/schema.json',
    style: options.style,
    tailwind: {
      config: options.tailwindConfig,
      css: options.tailwindCss,
      baseColor: options.tailwindBaseColor,
      cssVariables: options.tailwindCssVariables,
      prefix: options.tailwindPrefix,
    },
    typescript: options.typescript,
    aliases: {
      utils: options.utils,
      components: options.components,
      // TODO: fix this.
      lib: options.components.replace(/\/components$/, '/lib'),
      composables: options.components.replace(/\/components$/, '/composables'),
    },
  });
}

@injectable()
export class PromptForMinimalConfigService {
  constructor(
    @inject(GetProjectTailwindVersionFromConfigServiceId)
    private readonly getProjectTailwindVersionFromConfigService: GetProjectTailwindVersionFromConfigService
  ) {}

  async promptForMinimalConfig(
    defaultConfig: Config,
    opts: z.infer<typeof initOptionsSchema>
  ) {
    let style = defaultConfig.style;
    let baseColor = defaultConfig.tailwind.baseColor;
    let cssVariables = defaultConfig.tailwind.cssVariables;

    if (!opts.defaults) {
      const [styles, baseColors, tailwindVersion] = await Promise.all([
        getRegistryStyles(),
        getRegistryBaseColors(),
        this.getProjectTailwindVersionFromConfigService.getProjectTailwindVersionFromConfig(
          defaultConfig
        ),
      ]);

      const options = await prompts([
        {
          type: tailwindVersion === 'v4' ? null : 'select',
          name: 'style',
          message: `Which ${highlighter.info('style')} would you like to use?`,
          choices: styles.map((style) => ({
            title:
              style.name === 'new-york'
                ? 'New York (Recommended)'
                : style.label,
            value: style.name,
          })),
          initial: 0,
        },
        {
          type: opts.baseColor ? null : 'select',
          name: 'tailwindBaseColor',
          message: `Which color would you like to use as the ${highlighter.info(
            'base color'
          )}?`,
          choices: baseColors.map((color) => ({
            title: color.label,
            value: color.name,
          })),
        },
      ]);

      style = options.style ?? 'new-york';
      baseColor = options.tailwindBaseColor ?? baseColor;
      cssVariables = opts.cssVariables;
    }

    return rawConfigSchema.parse({
      $schema: defaultConfig?.$schema,
      style,
      tailwind: {
        ...defaultConfig?.tailwind,
        baseColor,
        cssVariables,
      },
      typescript: defaultConfig.typescript,
      aliases: defaultConfig?.aliases,
      iconLibrary: defaultConfig?.iconLibrary,
    });
  }
}
