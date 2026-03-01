import path from 'pathe';
import type { Config, RawConfig } from '../../src/utils/get-config';
import { Container } from '@x-oasis/di';
import { initServiceModules } from '../../src/commands/initService';
import {
  InitCommandService,
  InitCommandServiceId,
} from '../../src/commands/init';
import { MemFileSystem } from '../../src/services/file-system/MemFileSystem';
import { FileSystemServiceId } from '../../src/services/file-system/constants';
import type { Volume } from 'memfs';

/** Default RawConfig for fs-memfs-vue (Vite + Vue + Tailwind v4) */
export const defaultMemfsRawConfig: RawConfig = {
  $schema: 'https://ui.shadcn.com/schema.json',
  style: 'new-york',
  typescript: true,
  tailwind: {
    config: '',
    css: 'src/style.css',
    baseColor: 'zinc',
    cssVariables: true,
    prefix: '',
  },
  aliases: {
    components: '@/components',
    composables: '@/composables',
    utils: '@/lib/utils',
    ui: '@/components/ui',
    lib: '@/lib',
  },
  iconLibrary: 'lucide',
};

/** Build full Config with resolvedPaths for memfs (avoids get-tsconfig which uses Node fs) */
export function buildMemfsConfig(root: string, raw: RawConfig = defaultMemfsRawConfig): Config {
  return {
    ...raw,
    resolvedPaths: {
      cwd: root,
      tailwindConfig: raw.tailwind.config ? path.join(root, raw.tailwind.config) : '',
      tailwindCss: path.join(root, raw.tailwind.css),
      utils: path.join(root, 'src/lib/utils'),
      components: path.join(root, 'src/components'),
      composables: path.join(root, 'composables'),
      lib: path.join(root, 'src/lib'),
      ui: path.join(root, 'src/components/ui'),
    },
  } as Config;
}

/**
 * Run init against a memfs Volume. All file changes go to memfs.
 * Only updateDependencies (npm install) is skipped since execa cannot run against memfs paths.
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

  const initService: InitCommandService =
    container.get(InitCommandServiceId);

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
