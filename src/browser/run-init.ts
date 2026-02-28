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
import type { Config } from '@/utils/get-config';
import path from 'pathe';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './config';

/**
 * Run init against a memfs Volume. All file changes go to memfs.
 * Uses browser-compatible env services (no process/Node APIs).
 * Skips updateDependencies (npm install) and uses pre-built config.
 */
export async function runInitWithVolume(
  vol: Volume,
  root: string,
  config: Config = buildMemfsConfig(root)
) {
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

  const initService = container.get(InitCommandServiceId);

  return initService.runInit({
    cwd: root,
    yes: true,
    defaults: true,
    force: true,
    silent: true,
    skipPreflight: true,
    skipDependenciesInstall: true,
    skipAddComponents: true,
    config,
    isNewProject: false,
    cssVariables: true,
    style: 'index',
  });
}
