import type { RegistryItem } from '@/registry/schema';
import type { IFileSystemService } from '@/services/file-system/types';
import type { Config } from '@/utils/get-config';
import { getPackageManager } from '@/utils/get-package-manager';
import { spinner } from '@/utils/spinner';

import { execa } from 'execa';

import path from 'pathe';

/**
 * Install / record dependencies.
 *
 * - When `fileSystemService` is provided (browser / memfs), dependencies are
 *   written directly into package.json without spawning a package manager.
 * - Otherwise, the appropriate package manager is invoked via execa.
 */
export async function updateDependencies(
  dependencies: RegistryItem['dependencies'],
  devDependencies: RegistryItem['devDependencies'] = [],
  config: Config,
  options: {
    silent?: boolean;
    dev?: boolean;
    fileSystemService?: IFileSystemService;
  }
) {
  dependencies = Array.from(new Set(dependencies));
  if (!dependencies?.length && !devDependencies?.length) {
    return;
  }

  options = {
    silent: false,
    ...options,
  };

  const dependenciesSpinner = spinner(`Installing dependencies.`, {
    silent: options.silent,
  })?.start();

  if (options.fileSystemService) {
    await writePackageJsonDeps(
      options.fileSystemService,
      config.resolvedPaths.cwd,
      dependencies ?? [],
      devDependencies ?? []
    );
  } else {
    const packageManager = await getPackageManager(config.resolvedPaths.cwd);
    await installWithPackageManager(
      packageManager,
      dependencies ?? [],
      devDependencies ?? [],
      config.resolvedPaths.cwd,
      ''
    );
  }

  dependenciesSpinner?.succeed();
}

/**
 * Directly merge dependencies into package.json without running a package
 * manager. Used in browser / memfs environments where execa is unavailable.
 */
async function writePackageJsonDeps(
  fs: IFileSystemService,
  cwd: string,
  dependencies: string[],
  devDependencies: string[]
) {
  const pkgPath = path.resolve(cwd, 'package.json');
  if (!fs.fsExtra.existsSync(pkgPath)) return;

  const raw = await fs.promisifyFs.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(raw as string);

  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.devDependencies) pkg.devDependencies = {};

  for (const dep of dependencies) {
    const [name, version] = parseDep(dep);
    if (!pkg.dependencies[name]) {
      pkg.dependencies[name] = version;
    }
  }
  for (const dep of devDependencies) {
    const [name, version] = parseDep(dep);
    if (!pkg.devDependencies[name]) {
      pkg.devDependencies[name] = version;
    }
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

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}

async function installWithPackageManager(
  packageManager: Awaited<ReturnType<typeof getPackageManager>>,
  dependencies: string[],
  devDependencies: string[],
  cwd: string,
  flag?: string
) {
  if (packageManager === 'npm') {
    return installWithNpm(dependencies, devDependencies, cwd, flag);
  }

  if (packageManager === 'deno') {
    return installWithDeno(dependencies, devDependencies, cwd);
  }

  // if (packageManager === 'expo') {
  //   return installWithExpo(dependencies, devDependencies, cwd);
  // }

  if (dependencies?.length) {
    await execa(packageManager, ['add', ...dependencies], {
      cwd,
    });
  }

  if (devDependencies?.length) {
    await execa(packageManager, ['add', '-D', ...devDependencies], { cwd });
  }
}

async function installWithNpm(
  dependencies: string[],
  devDependencies: string[],
  cwd: string,
  flag?: string
) {
  if (dependencies.length) {
    await execa(
      'npm',
      ['install', ...(flag ? [`--${flag}`] : []), ...dependencies],
      { cwd }
    );
  }

  if (devDependencies.length) {
    await execa(
      'npm',
      ['install', ...(flag ? [`--${flag}`] : []), '-D', ...devDependencies],
      { cwd }
    );
  }
}

async function installWithDeno(
  dependencies: string[],
  devDependencies: string[],
  cwd: string
) {
  if (dependencies?.length) {
    await execa('deno', ['add', ...dependencies.map((dep) => `npm:${dep}`)], {
      cwd,
    });
  }

  if (devDependencies?.length) {
    await execa(
      'deno',
      ['add', '-D', ...devDependencies.map((dep) => `npm:${dep}`)],
      { cwd }
    );
  }
}
