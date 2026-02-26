import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
    'src/registry/index.ts',
    'src/registry/schema.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  alias: {
    '@': './src',
  },
})
