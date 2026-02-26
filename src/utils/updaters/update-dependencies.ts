import type { RegistryItem } from '@/delightless-vue/registry/schema';
import type { Config } from '@/delightless-vue/utils/get-config';
import { getPackageManager } from '@/delightless-vue/utils/get-package-manager';
import { spinner } from '@/delightless-vue/utils/spinner';

// import { addDependency } from 'nypm';
import { execa } from 'execa';

/**
 *
 * @param dependencies
 * @param config
 * @param options
 * @returns
 *
 * 安装三方依赖
 */
export async function updateDependencies(
  dependencies: RegistryItem['dependencies'],
  devDependencies: RegistryItem['devDependencies'] = [],
  config: Config,
  options: {
    silent?: boolean;
    dev?: boolean;
  }
) {
  dependencies = Array.from(new Set(dependencies));
  if (!dependencies?.length) {
    return;
  }

  options = {
    silent: false,
    ...options,
  };

  const dependenciesSpinner = spinner(`Installing dependencies.`, {
    silent: options.silent,
  })?.start();
  dependenciesSpinner?.start();

  const packageManager = await getPackageManager(config.resolvedPaths.cwd);

  // await addDependency(dependencies, {
  //   cwd: config.resolvedPaths.cwd,
  //   silent: true,
  //   dev: options?.dev,
  // });
  // dependenciesSpinner?.succeed();

  await installWithPackageManager(
    packageManager,
    dependencies,
    devDependencies,
    config.resolvedPaths.cwd,
    ''
  );

  dependenciesSpinner?.succeed();
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
