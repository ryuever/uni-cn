# uni-cn

Headless CLI for adding Vue/UI components. Based on [shadcn-vue](https://github.com/unovue/shadcn-vue), refactored with **Dependency Injection (DI)** to support swappable filesystem backends and run in both **Node.js** and **Browser** environments.

## Features

- **DI-based architecture** — filesystem operations are injectable (`NodeFileSystem` for real disk, `MemFileSystem` for in-memory).
- **Dual usage** — use as a CLI tool **or** call programmatically via function API.
- **Cross-environment** — runs on Node.js (full feature set) and in the browser (memfs-backed, no native I/O).
- **Log hooks** — subscribe to spinner / logger events for UI integration.

---

## Usage Modes

uni-cn can be used in two ways:

| Mode | Entry | Suitable for |
|------|-------|-------------|
| **CLI** | `uni-cn init` / `uni-cn add` | Terminal users, CI scripts |
| **Function Call** | `runInit()` / `runInitWithVolume()` etc. | Embedding in apps, tests, toolchains |

And two runtime environments:

| Environment | Filesystem | Dependency Install | Import Path |
|-------------|-----------|-------------------|-------------|
| **Node.js** | Real disk (`NodeFileSystem`) | `npm install` via execa | `uni-cn` |
| **Browser** | In-memory (`MemFileSystem` / memfs `Volume`) | Writes `package.json` directly (no npm) | `uni-cn/browser` |

---

## 1. CLI Mode (Node.js only)

### Install & Build

```bash
pnpm install
pnpm build
```

### Commands

```bash
# Initialize a project (interactive prompts)
npx uni-cn init

# Initialize with defaults, skip prompts
npx uni-cn init -y -d

# Add components
npx uni-cn add button -y
npx uni-cn add button card dialog -y

# Add all available components
npx uni-cn add -a -y

# Add a template (scaffold files as-is from registry)
npx uni-cn add template default --name my-project --style default
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REGISTRY_URL` | Custom registry base URL | `https://ui.shadcn.com` |
| `COMPONENTS_REGISTRY_URL` | Alias for `REGISTRY_URL` | — |

```bash
REGISTRY_URL=https://ui.shadcn.com/r npx uni-cn init -y -d
```

---

## 2. Function Call Mode

### Node.js

Import from `uni-cn`. Operations use real filesystem and can run `npm install`.

```ts
import { runInit } from 'uni-cn';

// Quick init — uses DI container internally
await runInit({
  cwd: '/path/to/project',
  yes: true,
  defaults: true,
  force: true,
  silent: true,
  isNewProject: false,
  style: 'index',
  cssVariables: true,
});
```

For more control (e.g. customizing DI bindings):

```ts
import { Container } from '@x-oasis/di';
import { initServiceModules } from 'uni-cn';
import { InitCommandServiceId } from 'uni-cn';

const container = new Container();
container.load(initServiceModules);
const initService = container.get(InitCommandServiceId);

await initService.runInit({ cwd: '/my-project', yes: true, /* ... */ });
```

### Browser (memfs)

Import from `uni-cn/browser`. All I/O goes through a memfs `Volume` — no real filesystem or shell is involved.

**Key differences from Node.js:**

- Must provide a memfs `Volume` instance and a virtual root path.
- Must provide or use `buildMemfsConfig()` to supply resolved config (bypasses `get-tsconfig`, `cosmiconfig` which require Node fs).
- `npm install` is skipped; dependencies are written directly into `package.json`.
- Use `setLogListener()` to capture spinner / logger output for display in a UI.

```ts
import { Volume } from 'memfs';
import {
  runInitWithVolume,
  runAddWithVolume,
  runAddTemplateWithVolume,
  buildMemfsConfig,
  setLogListener,
} from 'uni-cn/browser';

const vol = new Volume();
const root = '/project';
const config = buildMemfsConfig(root);

// Optional: capture CLI log output
setLogListener((entry) => {
  const icon = entry.status === 'succeed' ? '✔' : entry.status === 'fail' ? '✖' : 'ℹ';
  console.log(`${icon} ${entry.text}`);
});

// 1. Init — write components.json, update CSS, create utils.ts
await runInitWithVolume(vol, root, config, {
  skipAddComponents: false, // run full init flow
  silent: false,            // emit log events
});

// 2. Add component
await runAddWithVolume(vol, root, ['button'], config, {
  silent: false,
});

// 3. Add template
await runAddTemplateWithVolume(vol, root, {
  template: 'default',
  style: 'default',
  name: 'my-project',
});

// Clean up listener
setLogListener(null);
```

### API Reference

#### `uni-cn` (Node.js)

| Export | Description |
|--------|------------|
| `runInit(options)` | Run init command programmatically |
| `getRegistryIndex(config)` | Fetch registry index |
| `getRegistryItem(name, config)` | Fetch a single registry item |

#### `uni-cn/browser` (Browser / Memfs)

| Export | Description |
|--------|------------|
| `runInitWithVolume(vol, root, config?, options?)` | Init against a memfs Volume |
| `runAddWithVolume(vol, root, components, config?, options?)` | Add components to a memfs Volume |
| `runAddTemplateWithVolume(vol, root, options?)` | Add template files to a memfs Volume |
| `buildMemfsConfig(root, rawConfig?)` | Build a resolved `Config` object for memfs |
| `defaultMemfsRawConfig` | Default `RawConfig` (Vite + Vue + Tailwind v4) |
| `setLogListener(listener)` | Register/clear a global log listener |

#### Log Hook

Both environments emit log events through `setLogListener`. Each `LogEntry` contains:

```ts
interface LogEntry {
  type: 'spinner' | 'log';
  status: 'start' | 'succeed' | 'fail' | 'info' | 'log' | 'warn' | 'error' | 'break';
  text: string;
}
```

---

## Project Structure

```
src/
├── cli.ts              # CLI entry (bin)
├── index.ts            # Node.js library exports
├── browser/            # Browser entry: memfs-backed runners
│   ├── config.ts       # buildMemfsConfig, defaultMemfsRawConfig
│   ├── run-init.ts     # runInitWithVolume
│   ├── run-add.ts      # runAddWithVolume, runAddTemplateWithVolume
│   └── index.ts        # Browser exports
├── commands/
│   ├── init.ts         # Init command service
│   ├── add.ts          # Add command service (components + templates)
│   ├── initService.ts  # DI module for init
│   └── addService.ts   # DI module for add
├── services/
│   └── file-system/
│       ├── types.ts          # IFileSystemService interface
│       ├── NodeFileSystem.ts # Real fs (Node.js default)
│       └── MemFileSystem.ts  # In-memory fs (memfs)
├── registry/           # Registry API, schema, caching
├── preflights/         # Preflight checks
├── utils/
│   ├── add-components.ts     # Core component installation logic
│   ├── log-hook.ts           # setLogListener / notifyLog
│   ├── spinner.ts            # ora wrapper + log hook
│   ├── logger.ts             # consola wrapper + log hook
│   ├── transformers/         # Import, CSS, icon, SFC transformers
│   └── updaters/             # CSS vars, files, dependencies, templates
│
examples/
└── fs-vite-browser/    # Browser demo (Vite + Vue 3)
│
test/
└── browser-memfs/      # Memfs integration tests
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

### Browser Demo

```bash
cd examples/fs-vite-browser
pnpm install
pnpm dev
```

Open `http://localhost:5173`:

- **Init** tab — prepare project files, then run the full init flow.
- **Add** tab — switch between **Component** mode and **Template** mode.

### Testing

```bash
# All tests
pnpm test

# Browser-memfs integration tests only
pnpm vitest run test/browser-memfs/
```

## License

MIT
