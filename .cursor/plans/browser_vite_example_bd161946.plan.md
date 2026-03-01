---
name: Browser Vite Example
overview: Adapt uni-cn to run in browser per the feasibility report, and add a Vite-based example with init and create command demos that call the library from the browser.
todos: []
isProject: false
---

# Browser Adaptation and Vite Example Plan

## Summary

Per [docs/browser-feasibility-report.md](docs/browser-feasibility-report.md) (Scenario A: generate component code in browser, skip dependency install, return deps list), adapt the project for browser execution and add `examples/fs-vite-browser` with init and create demos.

---

## Phase 1: Core Library Browser Adaptations

### 1.1 Environment Abstractions

Create injectable services to replace Node APIs (per report Section 3.2):

- **ICwdService** - `cwd(): string` (replace `process.cwd()`)
- **ITempDirService** - `tmpdir(): string` (replace `node:os` tmpdir)
- **IExitService** - `exit(code: number): never` (replace `process.exit()`)

Add `src/services/env/`:

- `types.ts` - interface definitions and `createId` tokens
- `NodeCwdService`, `NodeTempDirService`, `NodeExitService` - Node implementations
- `BrowserCwdService`, `BrowserTempDirService`, `BrowserExitService` - Browser implementations (browser uses `/` or memfs root for cwd/tmpdir; exit throws)

### 1.2 Replace Direct Node API Usage


| File                                                                                         | Change                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/utils/updaters/create-template-files.ts](src/utils/updaters/create-template-files.ts)   | Replace `import * as path from 'path'` with `import path from 'pathe'`                                                                                                                                                                                                 |
| [src/utils/updaters/update-files.ts](src/utils/updaters/update-files.ts)                     | Replace `existsSync` from `node:fs` with `this.fileSystemService.fsExtra.existsSync`; inject `ITempDirService` and use it instead of `tmpdir()`; replace `process.cwd()` with `ICwdService.cwd()` for node_modules path (or skip that branch when using MemFileSystem) |
| [src/utils/updaters/update-tailwind-config.ts](src/utils/updaters/update-tailwind-config.ts) | Inject `ITempDirService`, use instead of `tmpdir()`                                                                                                                                                                                                                    |
| [src/commands/create.ts](src/commands/create.ts)                                             | Inject `ICwdService` or require `cwd` in options (already passed; remove `process.cwd()` fallback or inject)                                                                                                                                                           |
| [src/commands/init.ts](src/commands/init.ts)                                                 | Replace `process.exit()` with `IExitService.exit()`                                                                                                                                                                                                                    |
| [src/commands/add.ts](src/commands/add.ts)                                                   | Same for `process.exit()`                                                                                                                                                                                                                                              |
| [src/preflights/preflight-init.ts](src/preflights/preflight-init.ts)                         | Same                                                                                                                                                                                                                                                                   |
| [src/preflights/preflight-add.ts](src/preflights/preflight-add.ts)                           | Same                                                                                                                                                                                                                                                                   |
| [src/utils/handle-error.ts](src/utils/handle-error.ts)                                       | Same                                                                                                                                                                                                                                                                   |
| [src/registry/api.ts](src/registry/api.ts)                                                   | Replace `process.env.REGISTRY_URL` / `process.env.https_proxy` with optional injection or `typeof process !== 'undefined' ? process.env.X : undefined` for browser safety; avoid `ProxyAgent` when no proxy (browser uses native fetch)                                |


### 1.3 Browser-Specific Handling for update-files

The `!config.typescript` branch copies `node_modules` from `process.cwd()` - not possible in browser. Options:

- Add `skipNodeModulesCopy?: boolean` to updateFiles options; when true (browser/memfs), skip the cp and use a minimal temp structure for ts-morph
- Or: only run that branch when `config.typescript === false`; for browser we always use `config.typescript: true`, so this branch is never hit

Per runAddWithVolume, we use `config.typescript: true` and `tailwindVersion: 'v4'`. The `!config.typescript` block is skipped. So we only need to fix:

- `existsSync` -> `fileSystemService.fsExtra.existsSync`
- `tmpdir()` -> `ITempDirService.tmpdir()` (used only in that block when typescript is false; for typescript true, CreateSourceFileService in update-tailwind-config uses tmpdir - need to fix that)

### 1.4 Registry API ProxyAgent

In [src/registry/api.ts](src/registry/api.ts): `ProxyAgent` from undici is Node-only. For browser, use `agent: undefined` when `process.env.https_proxy` is not set, or when `typeof process === 'undefined'`. ofetch will use native fetch.

### 1.5 Process Polyfill for Browser

Add lightweight `process` polyfill for browser build so `process.env` and `process.cwd` don't throw when code paths are conditionally used. Option: use `process` npm package (browser field) or a minimal shim in `src/browser-polyfills/process.ts` that exports `{ cwd: () => '/', env: {}, exit: (c) => { throw new Error(`Exit ${c}`); } }`.

---

## Phase 2: Browser Entry and Build

### 2.1 Browser Entry Point

Create `src/browser.ts` that exports:

```ts
export { runInitWithVolume, runAddWithVolume, buildMemfsConfig, defaultMemfsRawConfig } from './examples/fs-memfs-vue/runInit';  // or move to src/
export { runCreateWithVolume } from './browser/create';  // new
```

Better: move `runInitWithVolume`, `runAddWithVolume`, `buildMemfsConfig` from examples into `src/browser/` so the main package can export them without depending on examples. Create `src/browser/run-init.ts`, `src/browser/run-add.ts`, `src/browser/run-create.ts`, `src/browser/config.ts`.

### 2.2 Create runCreateWithVolume

Create `src/browser/run-create.ts` (or add to examples and re-export):

```ts
export async function runCreateWithVolume(vol, root, options: { template, style, name }) {
  const container = new Container();
  container.load(createServiceModules);
  container.bind(FileSystemServiceId).toConstantValue(new MemFileSystem(vol));
  const createService = container.get(CreateCommandServiceId);
  await createService.runCreate({ cwd: root, ...options });
}
```

### 2.3 Build Configuration

Extend [tsdown.config.ts](tsdown.config.ts) or add Vite lib build for browser:

- Add `src/browser.ts` as entry for browser build
- `platform: 'browser'`
- `format: ['esm']`
- External: `vue-metamorph`, `@unovue/detypes`, `@vue/*`
- Define `process.env.NODE_ENV` and optionally `process.env.REGISTRY_URL`
- Alias `node:fs`, `node:os` to empty modules or polyfills

Alternatively: the Vite example will bundle uni-cn as a dependency; Vite will tree-shake and resolve browser-compatible code. We need to ensure no Node-only imports slip into the code paths used by init/create. The DI + MemFileSystem binding already avoids NodeFileSystem. The main fixes are: path->pathe, existsSync->fsExtra.existsSync, tmpdir->ITempDirService, process.exit->IExitService, and ProxyAgent handling.

---

## Phase 3: Vite Example

### 3.1 Create examples/fs-vite-browser

Scaffold a Vite + Vue + TypeScript project:

```
examples/fs-vite-browser/
  package.json
  vite.config.ts
  index.html
  src/
    main.ts
    App.vue
    examples/
      InitExample.vue   # init demo
      CreateExample.vue # create demo
```

### 3.2 Init Example

- Form: style, baseColor, components (optional), etc.
- On submit: create memfs Volume, call `runInitWithVolume` (or equivalent) with pre-built config
- Display generated `components.json` and any added files (if skipAddComponents is false, show add result)
- Use `skipDependenciesInstall: true`, `skipAddComponents: true` or `false` (if false, need resolvedPaths in config)

### 3.3 Create Example

- Form: template, style, project name
- On submit: create memfs Volume, call `runCreateWithVolume`
- Display generated files (from `vol.toJSON()` or similar)

### 3.4 Shared Setup

- Import `uni-cn` (or `uni-cn/browser` if we add that export)
- Use `memfs` Volume for in-memory project
- Render file tree / content in UI

---

## Phase 4: DI Module Updates

### 4.1 Register Environment Services

- Add `ICwdService`, `ITempDirService`, `IExitService` to initServiceModules, addServiceModules, createServiceModules
- Node modules bind to Node implementations
- For browser: create `browserServiceModules` or a factory that binds Browser implementations; use in browser entry

### 4.2 Optional: Browser-Specific Module

Create `src/commands/browserService.ts` that exports a Registry with:

- FileSystemServiceId -> MemFileSystem (caller provides Volume)
- ICwdService -> BrowserCwdService
- ITempDirService -> BrowserTempDirService
- IExitService -> BrowserExitService

The `runInitWithVolume` / `runAddWithVolume` / `runCreateWithVolume` functions load this browser module + command modules, then override FileSystemServiceId with the provided MemFileSystem.

---

## Implementation Order

1. Add env service interfaces and Node implementations (no breaking changes; Node impls use real process/tmpdir)
2. Replace `path` with `pathe` in create-template-files
3. Replace `existsSync` with `fileSystemService.fsExtra.existsSync` in update-files
4. Inject ITempDirService into CreateSourceFileService and UpdateFilesService; replace tmpdir()
5. Inject IExitService where process.exit is used
6. Fix registry api ProxyAgent for browser
7. Add runCreateWithVolume and consolidate browser helpers in src/browser/
8. Create examples/fs-vite-browser with init and create demos
9. Add browser build config and verify example runs
10. Fix any remaining issues; commit incrementally

---

## Key Files to Modify

- `src/services/env/` (new)
- `src/utils/updaters/create-template-files.ts`
- `src/utils/updaters/update-files.ts`
- `src/utils/updaters/update-tailwind-config.ts`
- `src/commands/create.ts`, `init.ts`, `add.ts`
- `src/preflights/preflight-init.ts`, `preflight-add.ts`
- `src/utils/handle-error.ts`
- `src/registry/api.ts`
- `src/browser/` (new), `src/index.ts` or package.json exports
- `examples/fs-vite-browser/` (new)
- `tsdown.config.ts` or new vite config for browser build

---

## Risks and Mitigations

- **ts-morph**: May have Node fs usage. CreateSourceFileService uses `mkdtemp` and `path.join` - both available via IFileSystemService and pathe. If ts-morph internally uses fs, consider `ts-morph-browser` or restricting browser to transforms that don't need it.
- **prompts**: Used in update-files for overwrite confirmation. For browser, pass `overwrite: true` to skip prompts.
- **consola/ora**: Use browser builds if available; or stub for silent mode.

