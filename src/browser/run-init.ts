import { Container } from '@x-oasis/di';
import { InitCommandService, InitCommandServiceId } from '@/commands/init';
import { initServiceModules } from '@/commands/initService';
import { FileSystemServiceId } from '@/services/file-system/constants';
import { MemFileSystem } from '@/services/file-system/MemFileSystem';
import {
  BrowserCwdService,
  BrowserExitService,
  BrowserTempDirService,
  ICwdServiceId,
  IExitServiceId,
  ITempDirServiceId,
} from '@/services/env';
import { GetProjectTailwindVersionFromConfigServiceId } from '@/utils/get-project-info';
import type { Config } from '@/utils/get-config';
import path from 'pathe';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './config';

export interface RunInitWithVolumeOptions {
  /**
   * When true, skip the addComponents step (only write components.json).
   * When false, run the full init flow: write components.json, fetch registry,
   * update CSS vars, write utils.ts, and update package.json dependencies.
   * @default true
   */
  skipAddComponents?: boolean;
  /** @default true */
  silent?: boolean;
}

/**
 * Run init against a memfs Volume. All file changes go to memfs.
 * Uses browser-compatible env services (no process/Node APIs).
 * npm install is always skipped; package.json dependencies are updated in-place.
 */
export async function runInitWithVolume(
  vol: Volume,
  root: string,
  config: Config = buildMemfsConfig(root),
  options: RunInitWithVolumeOptions = {}
) {
  const { skipAddComponents = true, silent = true } = options;

  const container = new Container();
  container.load(initServiceModules);
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

  const initService = container.get(InitCommandServiceId);

  return initService.runInit({
    cwd: root,
    yes: true,
    defaults: true,
    force: true,
    silent,
    skipPreflight: true,
    skipDependenciesInstall: true,
    skipAddComponents,
    tailwindVersion: 'v4',
    config,
    isNewProject: false,
    cssVariables: true,
    style: 'index',
  });
}
