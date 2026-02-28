import type { Config } from '../../src/utils/get-config';
import { Container } from '@x-oasis/di';
import { addServiceModules } from '../../src/commands/addService';
import { AddComponentsServiceId } from '../../src/utils/add-components';
import type { AddComponentsService } from '../../src/utils/add-components';
import { MemFileSystem } from '../../src/services/file-system/MemFileSystem';
import { FileSystemServiceId } from '../../src/services/file-system/constants';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './runInit';

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

  const addComponentsService: AddComponentsService =
    container.get(AddComponentsServiceId);

  return addComponentsService.addComponents(components, config, {
    overwrite: true,
    silent: true,
    skipDependenciesInstall: true,
    tailwindVersion: 'v4',
  });
}
