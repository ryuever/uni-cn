import { resolve } from 'pathe';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  exclude: [
    // Require transformTailwindConfig/transformCssVars/transformTailwindContent as standalone functions
    'test/utils/updaters/update-tailwind-config.test.ts',
    'test/utils/updaters/update-css-vars.test.ts',
    'test/utils/updaters/update-tailwind-content.test.ts',
    'test/utils/updaters/update-files.test.ts',
    'src/registry/api.test.ts',
    // transformSFC/detypes runtime error with complex Vue SFC
    'test/utils/transform-sfc.test.ts',
  ],
  },
});
