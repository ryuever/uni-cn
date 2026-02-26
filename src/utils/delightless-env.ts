import type {
  registryItemSchema,
  registryItemTypeSchema,
} from '@/registry/schema';

import type { z } from 'zod';

/**
 * 判断是不是从本地引入，目前主要是针对的 本身 delightless 这个项目中的互相应用
 * - ui: @xhs/delightless-xxx
 * - lib: @xhs/delightless-xxx
 *
 * 如果说是 import { Icon } from '@xhs/delightless' 的话，可以暂时不处理，因为
 * 这个会涉及到下载很多的dependencies
 */
export function isLocalImport(moduleSpecifier: string) {
  // 目前 @xhs/delightless 先不做处理
  return moduleSpecifier.startsWith('@xhs/delightless-');
}

/**
 * 相比于 shadcn 是通过 目录的方式来判断到底是什么类型，比如
 * - @/registry/ui
 * - @/registry/components
 *
 * 我们的判断方式会倾向于通过，读取registry信息来区分出类型，但是现在为了
 * 效率问题，可以先通过发布的包名来判断其类型
 *
 */
export const resolveSourceType = (
  exportedName: string
): z.infer<typeof registryItemTypeSchema> => {
  if (exportedName.startsWith('@xhs/delightless-shared')) {
    return 'registry:lib';
  }

  if (exportedName.startsWith('@xhs/delightless-lib-')) {
    return 'registry:lib';
  }

  if (exportedName.startsWith('@xhs/delightless-hook-')) {
    return 'registry:hook';
  }

  if (exportedName.startsWith('@xhs/delightless-composable-')) {
    return 'registry:composable';
  }

  if (exportedName.startsWith('@xhs/delightless-page-')) {
    return 'registry:page';
  }

  if (exportedName.startsWith('@xhs/delightless-file-')) {
    return 'registry:file';
  }

  if (exportedName.startsWith('@xhs/delightless-theme-')) {
    return 'registry:theme';
  }

  if (exportedName.startsWith('@xhs/delightless-style-')) {
    return 'registry:style';
  }

  if (exportedName.startsWith('@xhs/delightless-component-')) {
    return 'registry:component';
  }

  if (exportedName.startsWith('@xhs/delightless-block-')) {
    return 'registry:block';
  }

  if (exportedName.startsWith('@xhs/delightless-internal-')) {
    return 'registry:internal';
  }

  return 'registry:ui';
};

export const isDelightlessWorkspaceProject = (moduleName: string) => {
  return moduleName.startsWith('@xhs/delightless-');
};

export const resolveDelightlessProjectName = (moduleName: string) => {
  const matched = moduleName.match(/@xhs\/delightless([^/]*)/);

  if (!matched) {
    return null;
  }

  return `delightless${matched[1]}`;
};
