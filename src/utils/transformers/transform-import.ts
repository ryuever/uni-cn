import type { CodemodPlugin } from 'vue-metamorph';

import type { TransformOpts } from '.';
import { isLocalImport, resolveSourceType } from '../delightless-env';

export function transformImport(opts: TransformOpts): CodemodPlugin {
  return {
    type: 'codemod',
    name: 'modify import based on user config',

    transform({ scriptASTs, utils: { traverseScriptAST } }) {
      const transformCount = 0;
      const { config, isRemote } = opts;
      const utilsImport = '@/lib/utils';

      for (const scriptAST of scriptASTs) {
        traverseScriptAST(scriptAST, {
          visitImportDeclaration(path) {
            if (typeof path.node.source.value === 'string') {
              const sourcePath = path.node.source.value;

              // Alias to `moduleSpecifier`
              const updatedImport = updateImportAliases(
                sourcePath,
                config,
                isRemote
              );
              path.node.source.value = updatedImport;

              // Replace `import { cn } from "@/lib/utils"`
              if (updatedImport === utilsImport) {
                const namedImports =
                  path.node.specifiers?.map((node) => node.local?.name ?? '') ??
                  [];
                const cnImport = namedImports.find((i) => i === 'cn');
                if (cnImport) {
                  path.node.source.value =
                    updatedImport === utilsImport
                      ? sourcePath.replace(utilsImport, config.aliases.utils)
                      : config.aliases.utils;
                }
              }
            }
            return this.traverse(path);
          },
        });
      }

      return transformCount;
    },
  };
}

function updateImportAliases(
  moduleSpecifier: string,
  config: TransformOpts['config'],
  isRemote = false
) {
  // Not a local import.
  if (!isLocalImport(moduleSpecifier) && !isRemote) {
    return moduleSpecifier;
  }

  // This treats the remote as coming from a faux registry.
  if (isRemote && isLocalImport(moduleSpecifier)) {
    // moduleSpecifier = moduleSpecifier.replace(/^@\//, `@/registry/new-york/`);
  }

  if (moduleSpecifier.match(/@xhs\/delightless-([^/]+)$/)) {
    const sourceType = resolveSourceType(moduleSpecifier);

    /**
     * 如果说是
     */
    if (sourceType === 'registry:ui') {
      return moduleSpecifier.replace(
        /^@xhs/,
        config.aliases.ui ?? `${config.aliases.components}/ui`
      );
    }

    /**
     * 如果说是 import { cn } from '@xhs/delightless-lib-tailwind-utils' 转成下面的形式
     * import { cn } from '@/registry/lib/delightless-lib-tailwind-utils'
     */
    if (sourceType === 'registry:lib') {
      return moduleSpecifier.replace(
        /^@xhs/,
        config.aliases.lib ?? `${config.aliases.lib}`
      );
    }

    return moduleSpecifier.replace(/^@xhs/, config.aliases.components);
  }

  // Not a registry import.
  if (!moduleSpecifier.startsWith('@/registry/')) {
    // We fix the alias and return.
    const alias = config.aliases.components.split('/')[0];
    return moduleSpecifier.replace(/^@\//, `${alias}/`);
  }

  if (moduleSpecifier.match(/^@\/registry\/(.+)\/ui/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/ui/,
      config.aliases.ui ?? `${config.aliases.components}/ui`
    );
  }

  if (
    config.aliases.components &&
    moduleSpecifier.match(/^@\/registry\/(.+)\/components/)
  ) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/components/,
      config.aliases.components
    );
  }

  if (config.aliases.lib && moduleSpecifier.match(/^@\/registry\/(.+)\/lib/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/lib/,
      config.aliases.lib
    );
  }

  if (
    config.aliases.composables &&
    moduleSpecifier.match(/^@\/registry\/(.+)\/composables/)
  ) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/composables/,
      config.aliases.composables
    );
  }

  return moduleSpecifier.replace(
    /^@\/registry\/[^/]+/,
    config.aliases.components
  );
}
