import {
  getRegistryBaseColor,
  getRegistryIcons,
  RegistryGetThemeService,
  RegistryResolveItemsTreeService,
} from '@/registry/api';
import { MemFileSystem } from '@/services/file-system/MemFileSystem';
import type { IFileSystemService } from '@/services/file-system/types';
import { BrowserTempDirService } from '@/services/env/BrowserTempDirService';
import type { Config } from '@/utils/get-config';
import { transformCssVars } from '@/utils/transformers/transform-css-vars';
import { transformIcons } from '@/utils/transformers/transform-icons';
import { transformImport } from '@/utils/transformers/transform-import';
import { transformSFC } from '@/utils/transformers/transform-sfc';
import { UpdateCssService } from '@/utils/updaters/update-css';
import {
  TransformCssVarsService,
  UpdateCssVarsService,
} from '@/utils/updaters/update-css-vars';
import {
  AddTailwindConfigThemeService,
  CreateSourceFileService,
  ParseObjectLiteralService,
  TransformTailwindConfigService,
  UpdateTailwindConfigService,
} from '@/utils/updaters/update-tailwind-config';

import type { RegistryItem, registryItemFileSchema } from '@/registry/schema';
import type { Volume } from 'memfs';
import type { z } from 'zod';

import path, { dirname } from 'pathe';
import { transform as metaTransform } from 'vue-metamorph';
import { logger } from '@/utils/logger';
import { spinner } from '@/utils/spinner';

export interface BrowserApplyOptions {
  silent?: boolean;
  overwrite?: boolean;
  style?: string;
  tailwindVersion?: 'v3' | 'v4';
}

export async function applyComponentsToVolume(
  vol: Volume,
  root: string,
  components: string[],
  config: Config,
  options: BrowserApplyOptions = {}
) {
  const {
    silent = true,
    overwrite = true,
    style = config.style,
    tailwindVersion = 'v4',
  } = options;
  const fs = new MemFileSystem(vol);
  const registry = new RegistryResolveItemsTreeService(
    new RegistryGetThemeService()
  );
  const registrySpinner = spinner(`Checking registry.`, {
    silent,
  })?.start();
  const tree = await registry.registryResolveItemsTree(components, config);

  if (!tree) {
    registrySpinner?.fail();
    throw new Error('Failed to fetch components from registry.');
  }
  registrySpinner?.succeed();

  const tempDirService = new BrowserTempDirService(path.join(root, 'tmp'));
  const createSourceFileService = new CreateSourceFileService(
    fs,
    tempDirService
  );
  const parseObjectLiteralService = new ParseObjectLiteralService(
    createSourceFileService
  );
  const updateTailwindConfigService = new UpdateTailwindConfigService(
    fs,
    new TransformTailwindConfigService(
      createSourceFileService,
      new AddTailwindConfigThemeService(parseObjectLiteralService)
    )
  );
  await updateTailwindConfigService.updateTailwindConfig(
    tree.tailwind?.config,
    config,
    { silent, tailwindVersion }
  );

  const packageInfoService = {
    getPackageInfo: async (cwd = '', shouldThrow = true) => {
      const packageJsonPath = path.join(cwd, 'package.json');
      return fs.fsExtra.readJSONSync(packageJsonPath, {
        throws: shouldThrow,
      });
    },
  };
  const updateCssVarsService = new UpdateCssVarsService(
    fs,
    new TransformCssVarsService(fs, packageInfoService as never)
  );
  await updateCssVarsService.updateCssVars(tree.cssVars, config, {
    silent,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
    overwriteCssVars: components.includes('index'),
    initIndex: style === 'index',
  });

  await new UpdateCssService(fs).updateCss(tree.css, config, { silent });

  const dependenciesSpinner = spinner(`Installing dependencies.`, {
    silent,
  })?.start();
  await writePackageJsonDeps(
    fs,
    config.resolvedPaths.cwd,
    tree.dependencies ?? [],
    tree.devDependencies ?? []
  );
  dependenciesSpinner?.succeed();

  const result = await writeRegistryFilesToVolume(fs, root, tree.files, config, {
    overwrite,
    tailwindVersion,
  });
  logFilesResult(result, silent);
  return result;
}

async function writeRegistryFilesToVolume(
  fs: IFileSystemService,
  root: string,
  files: RegistryItem['files'],
  config: Config,
  options: {
    overwrite: boolean;
    tailwindVersion: 'v3' | 'v4';
  }
) {
  const filesCreated: string[] = [];
  const filesUpdated: string[] = [];
  const filesSkipped: string[] = [];

  if (!files?.length) {
    return { filesCreated, filesUpdated, filesSkipped };
  }

  const baseColor = await getRegistryBaseColor(config.tailwind.baseColor);
  const registryIcons = await getRegistryIcons();

  for (const file of files) {
    if (!file.content) {
      continue;
    }

    const filePath = resolveBrowserFilePath(file, config);
    const targetDir = dirname(filePath);
    const existingFile = fs.fsExtra.existsSync(filePath);

    if (existingFile && !options.overwrite) {
      filesSkipped.push(path.relative(root, filePath));
      continue;
    }

    const content = await transformBrowserRegistryFile({
      filename: path.join(root, 'registry', config.style, file.path),
      raw: file.content,
      config,
      baseColor,
      registryIcons,
      tailwindVersion: options.tailwindVersion,
    });

    if (existingFile) {
      const existingFileContent = await fs.promisifyFs.readFile(
        filePath,
        'utf-8'
      );
      if (String(existingFileContent).replace(/\r\n/g, '\n').trim() === content.replace(/\r\n/g, '\n').trim()) {
        filesSkipped.push(path.relative(root, filePath));
        continue;
      }
    }

    if (!fs.fsExtra.existsSync(targetDir)) {
      await fs.promisifyFs.mkdir(targetDir, { recursive: true });
    }

    await fs.promisifyFs.writeFile(filePath, content, 'utf-8');
    if (existingFile) {
      filesUpdated.push(path.relative(root, filePath));
    } else {
      filesCreated.push(path.relative(root, filePath));
    }
  }

  return { filesCreated, filesUpdated, filesSkipped };
}

async function transformBrowserRegistryFile(opts: {
  filename: string;
  raw: string;
  config: Config;
  baseColor: Awaited<ReturnType<typeof getRegistryBaseColor>>;
  registryIcons: Awaited<ReturnType<typeof getRegistryIcons>>;
  tailwindVersion: 'v3' | 'v4';
}) {
  const source = await transformSFC(opts);
  return metaTransform(source, opts.filename, [
    transformImport(opts),
    transformCssVars(opts),
    transformIcons(opts, opts.registryIcons),
  ]).code;
}

function resolveBrowserFilePath(
  file: z.infer<typeof registryItemFileSchema>,
  config: Config
) {
  if (file.target) {
    if (file.target.startsWith('~/')) {
      return path.join(config.resolvedPaths.cwd, file.target.replace('~/', ''));
    }
    return path.join(config.resolvedPaths.cwd, file.target.replace('src/', ''));
  }

  const targetDir = resolveBrowserFileTargetDirectory(file, config);
  return path.join(targetDir, resolveNestedFilePath(file.path, targetDir));
}

function resolveBrowserFileTargetDirectory(
  file: z.infer<typeof registryItemFileSchema>,
  config: Config
) {
  if (file.type === 'registry:ui') return config.resolvedPaths.ui;
  if (file.type === 'registry:lib') return config.resolvedPaths.lib;
  if (file.type === 'registry:hook' || file.type === 'registry:composable') {
    return config.resolvedPaths.composables;
  }
  return config.resolvedPaths.components;
}

function resolveNestedFilePath(filePath: string, targetDir: string) {
  const normalizedFilePath = filePath.replace(/^\/|\/$/g, '');
  const normalizedTargetDir = targetDir.replace(/^\/|\/$/g, '');
  const fileSegments = normalizedFilePath.split('/');
  const targetSegments = normalizedTargetDir.split('/');
  const commonDirIndex = fileSegments.findIndex(
    (segment) => segment === targetSegments[targetSegments.length - 1]
  );

  if (commonDirIndex === -1) {
    return fileSegments[fileSegments.length - 1];
  }

  return fileSegments.slice(commonDirIndex + 1).join('/');
}

async function writePackageJsonDeps(
  fs: IFileSystemService,
  cwd: string,
  dependencies: string[],
  devDependencies: string[]
) {
  const pkgPath = path.resolve(cwd, 'package.json');
  if (!fs.fsExtra.existsSync(pkgPath)) return;

  const raw = await fs.promisifyFs.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(String(raw));

  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};

  for (const dep of Array.from(new Set(dependencies))) {
    const [name, version] = parseDep(dep);
    pkg.dependencies[name] ??= version;
  }

  for (const dep of Array.from(new Set(devDependencies))) {
    const [name, version] = parseDep(dep);
    pkg.devDependencies[name] ??= version;
  }

  pkg.dependencies = sortObject(pkg.dependencies);
  pkg.devDependencies = sortObject(pkg.devDependencies);

  await fs.promisifyFs.writeFile(
    pkgPath,
    JSON.stringify(pkg, null, 2),
    'utf-8'
  );
}

function parseDep(dep: string): [name: string, version: string] {
  const atIdx = dep.lastIndexOf('@');
  if (atIdx > 0) {
    return [dep.slice(0, atIdx), dep.slice(atIdx + 1)];
  }
  return [dep, 'latest'];
}

function sortObject(obj: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}

function logFilesResult(
  result: {
    filesCreated: string[];
    filesUpdated: string[];
    filesSkipped: string[];
  },
  silent: boolean
) {
  if (result.filesCreated.length) {
    spinner(
      `Created ${result.filesCreated.length} ${
        result.filesCreated.length === 1 ? 'file' : 'files'
      }:`,
      { silent }
    )?.succeed();
    if (!silent) {
      for (const file of result.filesCreated) {
        logger.log(`  - ${file}`);
      }
    }
  }

  if (result.filesUpdated.length) {
    spinner(
      `Updated ${result.filesUpdated.length} ${
        result.filesUpdated.length === 1 ? 'file' : 'files'
      }:`,
      { silent }
    )?.info();
    if (!silent) {
      for (const file of result.filesUpdated) {
        logger.log(`  - ${file}`);
      }
    }
  }

  if (result.filesSkipped.length) {
    spinner(
      `Skipped ${result.filesSkipped.length} ${
        result.filesSkipped.length === 1 ? 'file' : 'files'
      }: (files might be identical, use --overwrite to overwrite)`,
      { silent }
    )?.info();
    if (!silent) {
      for (const file of result.filesSkipped) {
        logger.log(`  - ${file}`);
      }
    }
  }
}
