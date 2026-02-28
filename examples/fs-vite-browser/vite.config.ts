import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub Node-only deps for browser (uni-cn uses these but we skip those code paths)
      execa: path.resolve(__dirname, './src/stubs/execa.ts'),
      'get-tsconfig': path.resolve(__dirname, './src/stubs/get-tsconfig.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['uni-cn'],
  },
  ssr: {
    noExternal: ['uni-cn'],
  },
});
