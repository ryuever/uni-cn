import { Container } from '@x-oasis/di';
import {
  CreateCommandServiceId,
  createOptionsSchema,
} from '@/commands/create';
import { createServiceModules } from '@/commands/createService';
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
import path from 'pathe';
import type { Volume } from 'memfs';

export type RunCreateOptions = {
  template?: string;
  style?: string;
  name?: string;
};

/**
 * Run create against a memfs Volume. All file changes go to memfs.
 * Creates project from template (e.g. default) into vol at root.
 */
export async function runCreateWithVolume(
  vol: Volume,
  root: string,
  options: RunCreateOptions = {}
) {
  const opts = createOptionsSchema.parse({
    cwd: root,
    template: options.template ?? 'default',
    style: options.style ?? 'default',
    name: options.name ?? 'my-project',
  });

  const container = new Container();
  container.load(createServiceModules);
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

  const createService = container.get(CreateCommandServiceId);
  await createService.runCreate(opts);
}
