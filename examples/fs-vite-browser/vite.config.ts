import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const postcssStubs: Record<string, string> = {
  'postcss/lib/at-rule': 'postcss-at-rule',
  'postcss/lib/root': 'postcss-root',
  'postcss/lib/rule': 'postcss-rule',
  'postcss/lib/declaration': 'postcss-declaration',
};

function resolveStubsPlugin() {
  return {
    name: 'resolve-stubs',
    enforce: 'pre' as const,
    resolveId(id: string) {
      const stub = postcssStubs[id];
      if (stub) {
        return path.resolve(__dirname, `./src/stubs/${stub}.ts`);
      }
      if (id === 'postcss') {
        return path.resolve(__dirname, './src/stubs/postcss.ts');
      }
      if (id === 'ts-morph' || id === 'ts-morph/dist/ts-morph.js') {
        return path.resolve(__dirname, './src/stubs/ts-morph.ts');
      }
      if (id === 'process' || id === 'process/browser' || id.startsWith('process/') || id === 'node:process') {
        return path.resolve(__dirname, './src/stubs/process.ts');
      }
      if (id === 'fs-extra' || id.startsWith('fs-extra/')) {
        return path.resolve(__dirname, './src/stubs/fs-extra.ts');
      }
      if (id === 'node:fs' || id === 'fs') {
        return path.resolve(__dirname, './src/stubs/node-fs.ts');
      }
      if (id === 'node:events' || id === 'events') {
        return path.resolve(__dirname, 'node_modules/events/events.js');
      }
      if (id === 'node:stream' || id === 'stream') {
        return path.resolve(__dirname, 'node_modules/stream-browserify/index.js');
      }
      if (id === 'node:path' || id === 'path') {
        return path.resolve(__dirname, 'node_modules/path-browserify/index.js');
      }
      if (id === 'node:util/types' || id === 'util/types') {
        return path.resolve(__dirname, './src/stubs/node-util-types.ts');
      }
      if (id === 'node:util' || id === 'util') {
        return path.resolve(__dirname, 'node_modules/util/util.js');
      }
      if (id === 'node:module' || id === 'module') {
        return path.resolve(__dirname, './src/stubs/node-module.ts');
      }
      if (id === 'node:os' || id === 'os') {
        return path.resolve(__dirname, 'node_modules/os-browserify/browser.js');
      }
      if (id === 'child_process' || id === 'node:child_process') {
        return path.resolve(__dirname, './src/stubs/child-process.ts');
      }
      if (id === 'supports-color') {
        return path.resolve(__dirname, './src/stubs/supports-color.ts');
      }
      if (id === 'chalk') {
        return path.resolve(__dirname, './src/stubs/chalk.ts');
      }
      if (id === 'node:fs/promises' || id === 'fs/promises' || id.endsWith('fs/promises')) {
        return path.resolve(__dirname, './src/stubs/node-fs-promises.ts');
      }
      if (id === 'tty' || id === 'node:tty') {
        return path.resolve(__dirname, './src/stubs/tty.ts');
      }
      if (id === 'prompts') {
        return path.resolve(__dirname, './src/stubs/prompts.ts');
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [vue(), resolveStubsPlugin()],
  server: {
    proxy: {
      '/api/registry': {
        target: 'https://ui.shadcn.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/registry/, ''),
      },
    },
  },
  define: {
    'global': 'globalThis',
    // Force use of same-origin proxy in browser; prevents CORS from external registry
    'process.env.REGISTRY_URL': 'undefined',
  },
  resolve: {
    mainFields: ['module', 'import', 'browser', 'main'],
    conditions: ['import', 'module', 'browser', 'default'],
    alias: [
      // Bypass node_modules: always use parent's dist (avoids pnpm cache of old build)
      { find: 'uni-cn/browser', replacement: path.resolve(__dirname, '../../dist/browser/index.mjs') },
      { find: 'uni-cn', replacement: path.resolve(__dirname, '../../dist') },
      // Order matters: more specific first
      // memfs -> @jsonjoy.com/fs-node-builtins requires node:buffer; must use real buffer pkg
      { find: 'node:buffer', replacement: path.resolve(__dirname, 'node_modules/buffer/index.js') },
      { find: 'buffer', replacement: path.resolve(__dirname, 'node_modules/buffer/index.js') },
      { find: 'stream', replacement: path.resolve(__dirname, 'node_modules/stream-browserify/index.js') },
      { find: 'node:stream', replacement: path.resolve(__dirname, 'node_modules/stream-browserify/index.js') },
      { find: 'events', replacement: path.resolve(__dirname, 'node_modules/events/events.js') },
      { find: 'node:events', replacement: path.resolve(__dirname, 'node_modules/events/events.js') },
      { find: 'path', replacement: path.resolve(__dirname, 'node_modules/path-browserify/index.js') },
      { find: 'node:path', replacement: path.resolve(__dirname, 'node_modules/path-browserify/index.js') },
      { find: 'node:util/types', replacement: path.resolve(__dirname, './src/stubs/node-util-types.ts') },
      { find: 'util/types', replacement: path.resolve(__dirname, './src/stubs/node-util-types.ts') },
      { find: 'util', replacement: path.resolve(__dirname, 'node_modules/util/util.js') },
      { find: 'node:util', replacement: path.resolve(__dirname, 'node_modules/util/util.js') },
      { find: 'node:module', replacement: path.resolve(__dirname, './src/stubs/node-module.ts') },
      { find: 'module', replacement: path.resolve(__dirname, './src/stubs/node-module.ts') },
      { find: 'node:os', replacement: path.resolve(__dirname, 'node_modules/os-browserify/browser.js') },
      { find: 'os', replacement: path.resolve(__dirname, 'node_modules/os-browserify/browser.js') },
      { find: 'child_process', replacement: path.resolve(__dirname, './src/stubs/child-process.ts') },
      { find: 'node:child_process', replacement: path.resolve(__dirname, './src/stubs/child-process.ts') },
      { find: 'supports-color', replacement: path.resolve(__dirname, './src/stubs/supports-color.ts') },
      { find: 'chalk', replacement: path.resolve(__dirname, './src/stubs/chalk.ts') },
      { find: 'fs/promises', replacement: path.resolve(__dirname, './src/stubs/node-fs-promises.ts') },
      { find: 'node:fs/promises', replacement: path.resolve(__dirname, './src/stubs/node-fs-promises.ts') },
      { find: 'fs', replacement: path.resolve(__dirname, './src/stubs/node-fs.ts') },
      { find: 'node:fs', replacement: path.resolve(__dirname, './src/stubs/node-fs.ts') },
      { find: 'tty', replacement: path.resolve(__dirname, './src/stubs/tty.ts') },
      { find: 'node:tty', replacement: path.resolve(__dirname, './src/stubs/tty.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'execa', replacement: path.resolve(__dirname, './src/stubs/execa.ts') },
      { find: 'commander', replacement: path.resolve(__dirname, './src/stubs/commander.ts') },
      { find: 'get-tsconfig', replacement: path.resolve(__dirname, './src/stubs/get-tsconfig.ts') },
      { find: 'cosmiconfig', replacement: path.resolve(__dirname, './src/stubs/cosmiconfig.ts') },
      { find: 'fs-extra', replacement: path.resolve(__dirname, './src/stubs/fs-extra.ts') },
      { find: 'node:process', replacement: path.resolve(__dirname, './src/stubs/process.ts') },
      { find: 'process', replacement: path.resolve(__dirname, './src/stubs/process.ts') },
      { find: 'process/browser', replacement: path.resolve(__dirname, './src/stubs/process.ts') },
      { find: 'node:url', replacement: path.resolve(__dirname, './src/stubs/node-url.ts') },
      { find: 'url', replacement: path.resolve(__dirname, './src/stubs/node-url.ts') },
      { find: 'tinyglobby', replacement: path.resolve(__dirname, './src/stubs/tinyglobby.ts') },
      { find: 'vue-metamorph', replacement: path.resolve(__dirname, './src/stubs/vue-metamorph.ts') },
      { find: '@unovue/detypes', replacement: path.resolve(__dirname, './src/stubs/unovue-detypes.ts') },
      { find: 'prompts', replacement: path.resolve(__dirname, './src/stubs/prompts.ts') },
    ],
  },
  optimizeDeps: {
    exclude: ['uni-cn'],
    include: ['deepmerge', 'buffer', 'events', 'stream-browserify', 'readable-stream'],
  },
  ssr: {
    noExternal: ['uni-cn'],
  },
});
