import { Container } from '@x-oasis/di';
import { addServiceModules } from '@/commands/addService';
import { AddCommandServiceId } from '@/commands/add';
import type { AddCommandService } from '@/commands/add';
import { MemFileSystem } from '@/services/file-system/MemFileSystem';
import { FileSystemServiceId } from '@/services/file-system/constants';
import {
  BrowserCwdService,
  BrowserExitService,
  BrowserTempDirService,
  ICwdServiceId,
  IExitServiceId,
  ITempDirServiceId,
} from '@/services/env';
import { GetProjectTailwindVersionFromConfigServiceId } from '@/utils/get-project-info';
import { AddComponentsServiceId } from '@/utils/add-components';
import type { AddComponentsService } from '@/utils/add-components';
import type { Config } from '@/utils/get-config';
import path from 'pathe';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './config';

export interface RunAddWithVolumeOptions {
  /** @default true */
  silent?: boolean;
}

/**
 * Build a DI container configured for memfs/browser add operations.
 */
function createAddContainer(vol: Volume, root: string) {
  const container = new Container();
  container.load(addServiceModules);
  container
    .bind(FileSystemServiceId)
    .toConstantValue(new MemFileSystem(vol));
  container
    .bind(ICwdServiceId)
    .toConstantValue(new BrowserCwdService(root));
  container
    .bind(ITempDirServiceId)
    .toConstantValue(new BrowserTempDirService(path.join(root, 'tmp')));
  container
    .bind(IExitServiceId)
    .toConstantValue(new BrowserExitService());
  container
    .bind(GetProjectTailwindVersionFromConfigServiceId)
    .toConstantValue({
      getProjectTailwindVersionFromConfig: async () => 'v4' as const,
    });
  return container;
}

/**
 * Run add against a memfs Volume. All file changes go to memfs.
 * Bypasses getConfig (which uses Node fs) by passing pre-built config.
 * npm install is skipped since execa cannot run against memfs paths.
 */
export async function runAddWithVolume(
  vol: Volume,
  root: string,
  components: string[],
  config: Config = buildMemfsConfig(root),
  options: RunAddWithVolumeOptions = {}
) {
  const { silent = true } = options;
  const container = createAddContainer(vol, root);

  const addComponentsService: AddComponentsService =
    container.get(AddComponentsServiceId);

  return addComponentsService.addComponents(components, config, {
    overwrite: true,
    silent,
    skipDependenciesInstall: true,
    tailwindVersion: 'v4',
  });
}

export interface RunAddTemplateWithVolumeOptions {
  template?: string;
  style?: string;
  name?: string;
}

/**
 * Run `add template` against a memfs Volume. Downloads registry template
 * files and writes them as-is (no transforms).
 */
export async function runAddTemplateWithVolume(
  vol: Volume,
  root: string,
  options: RunAddTemplateWithVolumeOptions = {}
) {
  const container = createAddContainer(vol, root);

  const addService: AddCommandService =
    container.get(AddCommandServiceId);

  return addService.runAddTemplate({
    cwd: root,
    template: options.template ?? 'default',
    style: options.style ?? 'default',
    name: options.name ?? 'my-project',
  });
}
