import { createId, inject, injectable } from '@/delightless-vue/di';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import type { IFileSystemService } from '@/delightless-vue/services/file-system/types';
import type { Framework } from '@/delightless-vue/utils/frameworks';
import { FRAMEWORKS } from '@/delightless-vue/utils/frameworks';
import type { Config, RawConfig } from '@/delightless-vue/utils/get-config';
import {
  getConfig,
  getTSConfig,
  resolveConfigPaths,
} from '@/delightless-vue/utils/get-config';
import type { GetPackageInfoService } from '@/delightless-vue/utils/get-package-info';
import { GetPackageInfoServiceId } from '@/delightless-vue/utils/get-package-info';

import { z } from 'zod';

import path from 'pathe';

import { glob } from 'tinyglobby';

import { parseTsconfig } from 'get-tsconfig';

export type TailwindVersion = 'v3' | 'v4' | null;

export interface ProjectInfo {
  framework: Framework;
  typescript: boolean;
  tailwindConfigFile: string | null;
  tailwindCssFile: string | null;
  tailwindVersion: TailwindVersion;
  aliasPrefix: string | null;
}

const PROJECT_SHARED_IGNORE = [
  '**/node_modules/**',
  '.nuxt',
  'public',
  'dist',
  'build',
];

const TS_CONFIG_SCHEMA = z.object({
  compilerOptions: z.object({
    paths: z.record(z.string().or(z.array(z.string()))),
  }),
});

export const GetProjectInfoServiceId = createId('get-project-info-service-id');
export const GetTailwindCssFileServiceId = createId(
  'get-tailwind-css-file-service-id'
);
export const GetTailwindVersionServiceId = createId(
  'get-tailwind-version-service-id'
);



@injectable()
export class GetTailwindVersionService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(GetPackageInfoServiceId)
    private readonly getPackageInfoService: GetPackageInfoService
  ) {}

  async getTailwindVersion(
    cwd: string
  ): Promise<ProjectInfo['tailwindVersion']> {
    const [packageInfo, config] = await Promise.all([
      this.getPackageInfoService.getPackageInfo(cwd),
      getConfig(cwd),
    ]);

    // If the config file is empty, we can assume that it's a v4 project.
    if (config?.tailwind?.config === '') {
      return 'v4';
    }

    if (
      !packageInfo?.dependencies?.tailwindcss &&
      !packageInfo?.devDependencies?.tailwindcss
    ) {
      return null;
    }

    if (
      /^(?:\^|~)?3(?:\.\d+)*(?:-.*)?$/.test(
        packageInfo?.dependencies?.tailwindcss ||
          packageInfo?.devDependencies?.tailwindcss ||
          ''
      )
    ) {
      return 'v3';
    }

    return 'v4';
  }
}

@injectable()
export class GetTailwindCssFileService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(GetTailwindVersionServiceId)
    private readonly getTailwindVersionService: GetTailwindVersionService
  ) {}

  async getTailwindCssFile(cwd: string) {
    const [files, tailwindVersion] = await Promise.all([
      glob(['**/*.css', '**/*.scss'], {
        cwd,
        deep: 5,
        ignore: PROJECT_SHARED_IGNORE,
      }),
      this.getTailwindVersionService.getTailwindVersion(cwd),
    ]);

    if (!files.length) {
      return null;
    }

    const needle =
      tailwindVersion === 'v4' ? `@import "tailwindcss"` : '@tailwind base';
    for (const file of files) {
      const contents = await this.fileSystemService.promisifyFs.readFile(
        path.resolve(cwd, file),
        'utf8'
      );
      if (
        contents.includes(`@import "tailwindcss"`) ||
        contents.includes(`@import 'tailwindcss'`) ||
        contents.includes(`@tailwind base`)
      ) {
        return file;
      }
    }

    return null;
  }
}

@injectable()
export class GetProjectInfoService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(GetPackageInfoServiceId)
    private readonly getPackageInfoService: GetPackageInfoService,
    @inject(GetTailwindVersionServiceId)
    private readonly getTailwindVersionService: GetTailwindVersionService,
    @inject(GetTailwindCssFileServiceId)
    private readonly getTailwindCssFileService: GetTailwindCssFileService
  ) {}

  async getProjectInfo(cwd: string): Promise<ProjectInfo | null> {
    const [
      configFiles,
      typescript,
      tailwindConfigFile,
      tailwindCssFile,
      tailwindVersion,
      aliasPrefix,
    ] = await Promise.all([
      glob('**/{nuxt,vite,astro}.config.*|composer.json', {
        cwd,
        deep: 3,
        ignore: PROJECT_SHARED_IGNORE,
      }),
      isTypeScriptProject(cwd),
      getTailwindConfigFile(cwd),
      this.getTailwindCssFileService.getTailwindCssFile(cwd),
      this.getTailwindVersionService.getTailwindVersion(cwd),
      getTsConfigAliasPrefix(cwd),
      this.getPackageInfoService.getPackageInfo(cwd, false),
    ]);

    const type: ProjectInfo = {
      framework: FRAMEWORKS.manual,
      typescript,
      tailwindConfigFile,
      tailwindCssFile,
      tailwindVersion,
      aliasPrefix,
    };

    // Nuxt.
    if (configFiles.find((file) => file.startsWith('nuxt.config.'))?.length) {
      type.framework = FRAMEWORKS.nuxt;
      return type;
    }

    // Astro.
    if (configFiles.find((file) => file.startsWith('astro.config.'))?.length) {
      type.framework = FRAMEWORKS.astro;
      return type;
    }

    // Laravel.
    if (configFiles.find((file) => file.startsWith('composer.json'))?.length) {
      type.framework = FRAMEWORKS.laravel;
      return type;
    }

    // Vite.
    // We'll assume that it got caught by the Remix check above.
    if (configFiles.find((file) => file.startsWith('vite.config.'))?.length) {
      type.framework = FRAMEWORKS.vite;
      return type;
    }

    return type;
  }
}




export async function getTailwindConfigFile(cwd: string) {
  const files = await glob('tailwind.config.*', {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  });

  if (!files.length) {
    return null;
  }

  return files[0];
}

export async function getTsConfigAliasPrefix(cwd: string) {
  const isTypescript = await isTypeScriptProject(cwd);
  const tsconfigType = isTypescript ? 'tsconfig.json' : 'jsconfig.json';

  // TODO 可能存在路径读取问题，需要优化
  const tsConfig = getTSConfig(cwd, tsconfigType);
  const parsedTsConfig = parseTsconfig(tsConfig.path);

  const aliasPaths = parsedTsConfig.compilerOptions?.paths ?? {};

  // This assume that the first alias is the prefix.
  for (const [alias, paths] of Object.entries(aliasPaths)) {
    if (
      paths.includes('./*') ||
      paths.includes('./src/*') ||
      paths.includes('./app/*') ||
      paths.includes('./resources/js/*') // Laravel.
    ) {
      const cleanAlias = alias.replace(/\/\*$/, '') ?? null;
      // handle Nuxt
      return cleanAlias === '#build' ? '@' : cleanAlias;
    }
  }

  // Use the first alias as the prefix.
  return Object.keys(aliasPaths)?.[0]?.replace(/\/\*$/, '') ?? null;
}

export async function isTypeScriptProject(cwd: string) {
  const files = await glob('tsconfig.*', {
    cwd,
    deep: 1,
    ignore: PROJECT_SHARED_IGNORE,
  });

  return files.length > 0;
}

export const GetTsConfigServiceId = createId('get-tsconfig-service-id');
@injectable()
export class GetTsConfigService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService
  ) {}

  async getTsConfig(cwd: string) {
    for (const fallback of [
      'tsconfig.json',
      'tsconfig.web.json',
      'tsconfig.app.json',
    ]) {
      const filePath = path.resolve(cwd, fallback);
      if (!(await this.fileSystemService.promisifyFs.pathExists(filePath))) {
        continue;
      }

      // We can't use fs.readJSON because it doesn't support comments.
      const contents = await this.fileSystemService.promisifyFs.readFile(
        filePath,
        'utf8'
      );
      const cleanedContents = contents.replace(/\/\*\s*\*\//g, '');
      const result = TS_CONFIG_SCHEMA.safeParse(JSON.parse(cleanedContents));

      if (result.error) {
        continue;
      }

      return result.data;
    }

    return null;
  }
}

export const GetProjectConfigServiceId = createId(
  'get-project-config-service-id'
);
@injectable()
export class GetProjectConfigService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(GetProjectInfoServiceId)
    private readonly getProjectInfoService: GetProjectInfoService
  ) {}

  async getProjectConfig(
    cwd: string,
    defaultProjectInfo: ProjectInfo | null = null
  ): Promise<Config | null> {
    // Check for existing component config.
    const [existingConfig, projectInfo] = await Promise.all([
      getConfig(cwd),
      !defaultProjectInfo
        ? this.getProjectInfoService.getProjectInfo(cwd)
        : Promise.resolve(defaultProjectInfo),
    ]);

    if (existingConfig) {
      return existingConfig;
    }

    if (
      !projectInfo ||
      !projectInfo.tailwindCssFile ||
      (projectInfo.tailwindVersion === 'v3' && !projectInfo.tailwindConfigFile)
    ) {
      return null;
    }

    const config: RawConfig = {
      $schema: 'https://shadcn-vue.com/schema.json',
      typescript: projectInfo.typescript,
      style: 'new-york',
      tailwind: {
        config: projectInfo.tailwindConfigFile ?? '',
        baseColor: 'zinc',
        css: projectInfo.tailwindCssFile,
        cssVariables: true,
        prefix: '',
      },
      iconLibrary: 'lucide',
      aliases: {
        components: `${projectInfo.aliasPrefix}/components`,
        ui: `${projectInfo.aliasPrefix}/components/ui`,
        composables: `${projectInfo.aliasPrefix}/composables`,
        lib: `${projectInfo.aliasPrefix}/lib`,
        utils: `${projectInfo.aliasPrefix}/lib/utils`,
      },
    };

    return await resolveConfigPaths(cwd, config);
  }
}

export const GetProjectTailwindVersionFromConfigServiceId = createId(
  'get-project-tailwind-version-from-config-service-id'
);
@injectable()
export class GetProjectTailwindVersionFromConfigService {
  constructor(
    @inject(FileSystemServiceId)
    private readonly fileSystemService: IFileSystemService,
    @inject(GetProjectInfoServiceId)
    private readonly getProjectInfoService: GetProjectInfoService
  ) {}

  async getProjectTailwindVersionFromConfig(
    config: Config
  ): Promise<TailwindVersion> {
    if (!config.resolvedPaths?.cwd) {
      return 'v3';
    }

    const projectInfo = await this.getProjectInfoService.getProjectInfo(
      config.resolvedPaths.cwd
    );

    if (!projectInfo?.tailwindVersion) {
      return null;
    }

    return projectInfo.tailwindVersion;
  }
}

// export async function getProjectTailwindVersionFromConfig(
//   config: Config
// ): Promise<TailwindVersion> {
//   if (!config.resolvedPaths?.cwd) {
//     return 'v3';
//   }

//   const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);

//   if (!projectInfo?.tailwindVersion) {
//     return null;
//   }

//   return projectInfo.tailwindVersion;
// }
