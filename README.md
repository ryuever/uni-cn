# uni-cn

Headless CLI for adding Vue/UI components. Based on [shadcn-vue](https://github.com/unovue/shadcn-vue), refactored with **Dependency Injection (DI)** to support swappable filesystem backends (Node fs, memfs for tests, etc.).

## Features

- **DI-based architecture**: `fs` and filesystem operations are injectable; use `NodeFileSystem` (real disk) or `MemFileSystem` (in-memory) for testing or non-Node environments.
- **`init` & `add` commands**: Initialize a project and add components from the registry.
- **Programmatic API**: Use `runInit(options)` for embedding or testing.

## Quick Start

```bash
# Initialize
pnpm run build
node dist/cli.mjs init -y

# Add components
node dist/cli.mjs add button -y
```

## Programmatic Usage

```ts
import { runInit } from 'uni-cn';

await runInit({
  cwd: '/path/to/project',
  yes: true,
  defaults: true,
  force: true,
  silent: true,
  style: 'index',
  cssVariables: true,
});
```

## Testing with MemFileSystem

For tests or headless environments, you can bind `MemFileSystem` to replace the default `NodeFileSystem`. This allows running the CLI logic without touching the real filesystem (e.g. in CI or browser-like environments).

## Project Structure

```
src/
├── commands/       # init, add CLI commands
├── di/             # DI container, Registry, @inject
├── services/
│   └── file-system/
│       ├── types.ts        # IFileSystemService interface
│       ├── NodeFileSystem.ts  # Real fs (default)
│       └── MemFileSystem.ts   # In-memory (memfs)
├── preflights/     # Preflight checks
├── registry/       # Registry API
├── utils/          # add-components, updaters, transformers
├── index.ts        # Library exports + runInit
└── cli.ts          # CLI entry (bin)
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

### Test Status

- **59 tests passing** across 15 test files
- Excluded (pending DI/API adaptation): `update-tailwind-config`, `update-css-vars`, `update-tailwind-content`, `update-files`, `registry/api`, `transform-sfc` tests

## License

MIT
