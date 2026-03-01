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
      utils: path.join(root, 'src/lib/utils'),
      components: path.join(root, 'src/components'),
      composables: path.join(root, 'composables'),
      lib: path.join(root, 'src/lib'),
      ui: path.join(root, 'src/components/ui'),
    },
  } as Config;
}
