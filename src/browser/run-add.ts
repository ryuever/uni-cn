import { MemFileSystem } from '@/services/file-system/MemFileSystem';
import type { Config } from '@/utils/get-config';
import { CreateTemplateFilesService } from '@/utils/updaters/create-template-files';

import type { Volume } from 'memfs';

import { applyComponentsToVolume } from './apply-components';
import { buildMemfsConfig } from './config';

export interface RunAddWithVolumeOptions {
  /** @default true */
  silent?: boolean;
  /** @default true */
  overwrite?: boolean;
  /** @default "v4" */
  tailwindVersion?: 'v3' | 'v4';
}

/**
 * Run add against a memfs Volume. All file changes go to memfs.
 * Bypasses getConfig (which uses Node fs) by passing pre-built config.
 * npm install is skipped; dependencies are merged into package.json.
 */
export async function runAddWithVolume(
  vol: Volume,
  root: string,
  components: string[],
  config: Config = buildMemfsConfig(root),
  options: RunAddWithVolumeOptions = {}
) {
  const {
    silent = true,
    overwrite = true,
    tailwindVersion = 'v4',
  } = options;

  return applyComponentsToVolume(vol, root, components, config, {
    silent,
    overwrite,
    tailwindVersion,
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
  return new CreateTemplateFilesService(new MemFileSystem(vol)).createTemplateFiles(
    root,
    {
      cwd: root,
      template: options.template ?? 'default',
      style: options.style ?? 'default',
      name: options.name ?? 'my-project',
    }
  );
}
