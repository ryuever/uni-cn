import { MemFileSystem } from '@/services/file-system/MemFileSystem';
import type { Config } from '@/utils/get-config';
import path from 'pathe';
import type { Volume } from 'memfs';
import { buildMemfsConfig } from './config';
import { applyComponentsToVolume } from './apply-components';
import { spinner } from '@/utils/spinner';

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
  /** @default "v4" */
  tailwindVersion?: 'v3' | 'v4';
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
  const {
    skipAddComponents = true,
    silent = true,
    tailwindVersion = 'v4',
  } = options;

  const fs = new MemFileSystem(vol);
  const { resolvedPaths: _resolvedPaths, ...configForDisk } = config;
  const componentSpinner = spinner(`Writing components.json.`, {
    silent,
  }).start();
  await fs.promisifyFs.writeFile(
    path.resolve(root, 'components.json'),
    JSON.stringify(configForDisk, null, 2),
    'utf8'
  );
  componentSpinner?.succeed();

  if (skipAddComponents) {
    return config;
  }

  await applyComponentsToVolume(vol, root, ['index'], config, {
    silent,
    overwrite: true,
    style: 'index',
    tailwindVersion,
  });

  return config;
}
