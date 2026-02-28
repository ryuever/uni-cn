import { Container } from '@x-oasis/di';
import { addServiceModules } from '@/commands/addService';
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
import { AddComponentsServiceId } from '@/utils/add-components';
import type { AddComponentsService } from '@/utils/add-components';
import type { Config } from '@/utils/get-config';
import path from 'pathe';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './config';

/**
 * Run add against a memfs Volume. All file changes go to memfs.
 * Bypasses getConfig (which uses Node fs) by passing pre-built config.
 * npm install is skipped since execa cannot run against memfs paths.
 */
export async function runAddWithVolume(
  vol: Volume,
  root: string,
  components: string[],
  config: Config = buildMemfsConfig(root)
) {
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

  const addComponentsService: AddComponentsService =
    container.get(AddComponentsServiceId);

  return addComponentsService.addComponents(components, config, {
    overwrite: true,
    silent: true,
    skipDependenciesInstall: true,
    tailwindVersion: 'v4',
  });
}
