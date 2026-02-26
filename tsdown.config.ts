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
  // Vue compiler packages have fragile internal structure; bundling breaks makeMap etc.
  external: ['vue-metamorph', '@unovue/detypes', /^@vue\//],
})
