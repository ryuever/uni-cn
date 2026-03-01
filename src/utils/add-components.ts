/* eslint-disable prefer-const */
import { createId, inject, injectable } from '@x-oasis/di';
import {
  fetchRegistry,
  getRegistryParentMap,
  getRegistryTypeAliasMap,
  RegistryResolveItemsTreeServiceId,
  resolveRegistryItems,
} from '@/registry/api';
import type { RegistryResolveItemsTreeService } from '@/registry/api';
import { registryItemSchema } from '@/registry/schema';
import { FileSystemServiceId } from '@/services/file-system/constants';
import type { IFileSystemService } from '@/services/file-system/types';
import type {
  Config,
  configSchema,
  workspaceConfigSchema,
} from '@/utils/get-config';
import {
  findCommonRoot,
  findPackageRoot,
  getWorkspaceConfig,
} from '@/utils/get-config';
import { FRAMEWORKS } from '@/utils/frameworks';
import { handleError } from '@/utils/handle-error';
import { logger } from '@/utils/logger';
import { spinner } from '@/utils/spinner';
import type { UpdateCssService } from '@/utils/updaters/update-css';
import { UpdateCssServiceId } from '@/utils/updaters/update-css';
import { updateDependencies } from '@/utils/updaters/update-dependencies';
import type { UpdateFilesService } from '@/utils/updaters/update-files';
import { UpdateFilesServiceId } from '@/utils/updaters/update-files';
import type { UpdateTailwindConfigService } from '@/utils/updaters/update-tailwind-config';
import { UpdateTailwindConfigServiceId } from '@/utils/updaters/update-tailwind-config';

import { z } from 'zod';

import path from 'pathe';

import type { GetProjectTailwindVersionFromConfigService } from './get-project-info';
import { GetProjectTailwindVersionFromConfigServiceId } from './get-project-info';
import type { UpdateCssVarsService } from './updaters/update-css-vars';
import { UpdateCssVarsServiceId } from './updaters/update-css-vars';

export const AddComponentsServiceId = createId('add-components-service-id');
export const AddProjectComponentsServiceId = createId(
  'add-project-components-service-id'
);
export const AddWorkspaceComponentsServiceId = createId(
  'add-workspace-components-service-id'
);
@injectable()
export class AddComponentsService {
  constructor(
    @inject(AddProjectComponentsServiceId)
    private readonly addProjectComponentsService: AddProjectComponentsService,
    @inject(AddWorkspaceComponentsServiceId)
    private readonly addWorkspaceComponentsService: AddWorkspaceComponentsService
  ) {}

  async addComponents(
    components: string[],
    config: Config,
    options: {
      overwrite?: boolean;
      silent?: boolean;
      isNewProject?: boolean;
      style?: string;
      /** When true, skip updateDependencies (npm install). For memfs. */
      skipDependenciesInstall?: boolean;
      /** When provided, skip getProjectInfo (uses Node fs). For memfs. */
      tailwindVersion?: 'v3' | 'v4';
    }
  ) {
    options = {
      overwrite: false,
      silent: false,
      isNewProject: false,
      style: 'index',
      ...options,
    };

    const workspaceConfig = await getWorkspaceConfig(config);
    if (
      workspaceConfig &&
      workspaceConfig.ui &&
      workspaceConfig.ui.resolvedPaths.cwd !== config.resolvedPaths.cwd
    ) {
      return await this.addWorkspaceComponentsService.addWorkspaceComponents(
        components,
        config,
        workspaceConfig,
        {
          ...options,
          isRemote:
            // 这个参数目前对我们的场景没有用，它主要用于处理从 shadcn/ui 聊天界面 分享的组件链接
            components?.length === 1 && !!components[0].match(/\/chat\/b\//),
        }
      );
    }

    return await this.addProjectComponentsService.addProjectComponents(
      components,
      config,
      options
    );
  }
}

@injectable()
export class AddProjectComponentsService {
  constructor(
    @inject(GetProjectTailwindVersionFromConfigServiceId)
    private readonly getProjectTailwindVersionFromConfigService: GetProjectTailwindVersionFromConfigService,
    @inject(UpdateCssVarsServiceId)
    private readonly updateCssVarsService: UpdateCssVarsService,
    @inject(UpdateTailwindConfigServiceId)
    private readonly updateTailwindConfigService: UpdateTailwindConfigService,
    @inject(UpdateCssServiceId)
    private readonly updateCssService: UpdateCssService,
    @inject(RegistryResolveItemsTreeServiceId)
    private readonly registryResolveItemsTreeService: RegistryResolveItemsTreeService,
    @inject(UpdateFilesServiceId)
    private readonly updateFilesService: UpdateFilesService,
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService
  ) {}

  async addProjectComponents(
    components: string[],
    config: z.infer<typeof configSchema>,
    options: {
      overwrite?: boolean;
      silent?: boolean;
      isNewProject?: boolean;
      style?: string;
      skipDependenciesInstall?: boolean;
      /** When provided, skip getProjectInfo (uses Node fs). For memfs. */
      tailwindVersion?: 'v3' | 'v4';
    }
  ) {
    const registrySpinner = spinner(`Checking registry.`, {
      silent: options.silent,
    })?.start();
    const tree =
      await this.registryResolveItemsTreeService.registryResolveItemsTree(
        components,
        config
      );
    if (!tree) {
      registrySpinner?.fail();
      return handleError(
        new Error('Failed to fetch components from registry.')
      );
    }
    registrySpinner?.succeed();

    const tailwindVersion =
      options.tailwindVersion ??
      (await this.getProjectTailwindVersionFromConfigService.getProjectTailwindVersionFromConfig(
        config
      ));

    await this.updateTailwindConfigService.updateTailwindConfig(
      tree.tailwind?.config,
      config,
      {
        silent: options.silent,
        tailwindVersion,
      }
    );

    const overwriteCssVars = await shouldOverwriteCssVars(components, config);
    await this.updateCssVarsService.updateCssVars(tree.cssVars, config, {
      cleanupDefaultNextStyles: options.isNewProject,
      silent: options.silent,
      tailwindVersion,
      tailwindConfig: tree.tailwind?.config,
      overwriteCssVars,
      initIndex: options.style ? options.style === 'index' : false,
    });

    // Add CSS updater
    await this.updateCssService.updateCss(tree.css, config, {
      silent: options.silent,
    });

    await updateDependencies(tree.dependencies, tree.devDependencies, config, {
      silent: options.silent,
      ...(options.skipDependenciesInstall && {
        fileSystemService: this.fileSystemService,
      }),
    });
    const memfsMode = options.tailwindVersion !== undefined;
    await this.updateFilesService.updateFiles(tree.files, config, {
      overwrite: options.overwrite,
      silent: options.silent,
      ...(memfsMode && {
        projectInfo: {
          framework: FRAMEWORKS.vite,
          typescript: true,
          tailwindConfigFile: null,
          tailwindCssFile: 'src/style.css',
          tailwindVersion: options.tailwindVersion ?? 'v4',
          aliasPrefix: '@',
        },
        skipImportResolution: true,
      }),
    });

    if (tree.docs) {
      logger.info(tree.docs);
    }
  }
}

@injectable()
export class AddWorkspaceComponentsService {
  constructor(
    @inject(GetProjectTailwindVersionFromConfigServiceId)
    private readonly getProjectTailwindVersionFromConfigService: GetProjectTailwindVersionFromConfigService,
    @inject(UpdateCssServiceId)
    private readonly updateCssService: UpdateCssService,
    @inject(UpdateCssVarsServiceId)
    private readonly updateCssVarsService: UpdateCssVarsService,
    @inject(UpdateTailwindConfigServiceId)
    private readonly updateTailwindConfigService: UpdateTailwindConfigService,
    @inject(UpdateFilesServiceId)
    private readonly updateFilesService: UpdateFilesService
  ) {}

  async addWorkspaceComponents(
    components: string[],
    config: z.infer<typeof configSchema>,
    workspaceConfig: z.infer<typeof workspaceConfigSchema>,
    options: {
      overwrite?: boolean;
      silent?: boolean;
      isNewProject?: boolean;
      isRemote?: boolean;
      style?: string;
      skipDependenciesInstall?: boolean;
    }
  ) {
    const registrySpinner = spinner(`Checking registry.`, {
      silent: options.silent,
    })?.start();
    let registryItems = await resolveRegistryItems(components, config);
    let result = await fetchRegistry(registryItems);
    const payload = z.array(registryItemSchema).parse(result);
    if (!payload) {
      registrySpinner?.fail();
      return handleError(
        new Error('Failed to fetch components from registry.')
      );
    }
    registrySpinner?.succeed();

    const registryParentMap = getRegistryParentMap(payload);
    const registryTypeAliasMap = getRegistryTypeAliasMap();

    const filesCreated: string[] = [];
    const filesUpdated: string[] = [];
    const filesSkipped: string[] = [];

    const rootSpinner = spinner(`Installing components.`)?.start();

    for (const component of payload) {
      const alias = registryTypeAliasMap.get(component.type);
      const registryParent = registryParentMap.get(component.name);

      // We don't support this type of component.
      if (!alias) {
        continue;
      }

      // A good start is ui for now.
      // TODO: Add support for other types.
      let targetConfig =
        component.type === 'registry:ui' ||
        registryParent?.type === 'registry:ui'
          ? workspaceConfig.ui
          : config;

      const tailwindVersion =
        await this.getProjectTailwindVersionFromConfigService.getProjectTailwindVersionFromConfig(
          targetConfig
        );

      const workspaceRoot = findCommonRoot(
        config.resolvedPaths.cwd,
        targetConfig.resolvedPaths.ui
      );
      const packageRoot =
        (await findPackageRoot(
          workspaceRoot,
          targetConfig.resolvedPaths.cwd
        )) ?? targetConfig.resolvedPaths.cwd;

      // 1. Update tailwind config.
      if (component.tailwind?.config) {
        await this.updateTailwindConfigService.updateTailwindConfig(
          component.tailwind?.config,
          targetConfig,
          {
            silent: true,
            tailwindVersion,
          }
        );
        filesUpdated.push(
          path.relative(
            workspaceRoot,
            targetConfig.resolvedPaths.tailwindConfig
          )
        );
      }

      // 2. Update css vars.
      if (component.cssVars) {
        const overwriteCssVars = await shouldOverwriteCssVars(
          components,
          config
        );
        await this.updateCssVarsService.updateCssVars(
          component.cssVars,
          targetConfig,
          {
            silent: true,
            tailwindVersion,
            tailwindConfig: component.tailwind?.config,
            overwriteCssVars,
          }
        );
        filesUpdated.push(
          path.relative(workspaceRoot, targetConfig.resolvedPaths.tailwindCss)
        );
      }

      // 3. Update CSS
      if (component.css) {
        await this.updateCssService.updateCss(component.css, targetConfig, {
          silent: true,
        });
        filesUpdated.push(
          path.relative(workspaceRoot, targetConfig.resolvedPaths.tailwindCss)
        );
      }

      // 4. Update dependencies.
      await updateDependencies(
        component.dependencies,
        component.devDependencies,
        targetConfig,
        { silent: true }
      );

      // 5. Update files.
      const files = await this.updateFilesService.updateFiles(
        component.files,
        targetConfig,
        {
          overwrite: options.overwrite,
          silent: true,
          rootSpinner,
          isRemote: options.isRemote,
        }
      );

      filesCreated.push(
        ...files.filesCreated.map((file) =>
          path.relative(workspaceRoot, path.join(packageRoot, file))
        )
      );
      filesUpdated.push(
        ...files.filesUpdated.map((file) =>
          path.relative(workspaceRoot, path.join(packageRoot, file))
        )
      );
      filesSkipped.push(
        ...files.filesSkipped.map((file) =>
          path.relative(workspaceRoot, path.join(packageRoot, file))
        )
      );
    }

    rootSpinner?.succeed();

    // Sort files.
    filesCreated.sort();
    filesUpdated.sort();
    filesSkipped.sort();

    const hasUpdatedFiles = filesCreated.length || filesUpdated.length;
    if (!hasUpdatedFiles && !filesSkipped.length) {
      spinner(`No files updated.`, {
        silent: options.silent,
      })?.info();
    }

    if (filesCreated.length) {
      spinner(
        `Created ${filesCreated.length} ${
          filesCreated.length === 1 ? 'file' : 'files'
        }:`,
        {
          silent: options.silent,
        }
      )?.succeed();
      for (const file of filesCreated) {
        logger.log(`  - ${file}`);
      }
    }

    if (filesUpdated.length) {
      spinner(
        `Updated ${filesUpdated.length} ${
          filesUpdated.length === 1 ? 'file' : 'files'
        }:`,
        {
          silent: options.silent,
        }
      )?.info();
      for (const file of filesUpdated) {
        logger.log(`  - ${file}`);
      }
    }

    if (filesSkipped.length) {
      spinner(
        `Skipped ${filesSkipped.length} ${
          filesUpdated.length === 1 ? 'file' : 'files'
        }: (use --overwrite to overwrite)`,
        {
          silent: options.silent,
        }
      )?.info();
      for (const file of filesSkipped) {
        logger.log(`  - ${file}`);
      }
    }
  }
}

async function shouldOverwriteCssVars(
  components: z.infer<typeof registryItemSchema>['name'][],
  config: z.infer<typeof configSchema>
) {
  const registryItems = await resolveRegistryItems(components, config);
  const result = await fetchRegistry(registryItems);
  const payload = z.array(registryItemSchema).parse(result);

  return payload.some(
    (component) =>
      component.type === 'registry:theme' || component.type === 'registry:style'
  );
}

