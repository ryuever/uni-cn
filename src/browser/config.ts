import path from 'pathe';
import type { Config, RawConfig } from '@/utils/get-config';

/** Default RawConfig for browser/memfs (Vite + Vue + Tailwind v4) */
export const defaultMemfsRawConfig: RawConfig = {
  $schema: 'https://shadcn-vue.com/schema.json',
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
export function buildMemfsConfig(
  root: string,
  raw: RawConfig = defaultMemfsRawConfig
): Config {
  return {
    ...raw,
    resolvedPaths: {
      cwd: root,
      tailwindConfig: raw.tailwind.config
        ? path.join(root, raw.tailwind.config)
        : '',
      tailwindCss: path.join(root, raw.tailwind.css),
      utils: resolveAliasPath(root, raw.aliases.utils, 'src/lib/utils'),
      components: resolveAliasPath(root, raw.aliases.components, 'src/components'),
      composables: resolveAliasPath(root, raw.aliases.composables, 'src/composables'),
      lib: resolveAliasPath(root, raw.aliases.lib, 'src/lib'),
      ui: resolveAliasPath(
        root,
        raw.aliases.ui,
        path.join(aliasToRelativePath(raw.aliases.components), 'ui')
      ),
    },
  } as Config;
}

function resolveAliasPath(
  root: string,
  alias: string | undefined,
  fallback: string
) {
  return path.join(root, alias ? aliasToRelativePath(alias) : fallback);
}

function aliasToRelativePath(alias: string) {
  if (alias.startsWith('@/')) {
    return path.join('src', alias.slice(2));
  }

  if (alias.startsWith('~/')) {
    return alias.slice(2);
  }

  if (alias.startsWith('./')) {
    return alias.slice(2);
  }

  if (alias.startsWith('/')) {
    return alias.slice(1);
  }

  return alias;
}
