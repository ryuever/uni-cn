# uni-cn 浏览器运行可行性评估报告（场景 A）

> **场景 A**：浏览器中生成组件代码，跳过依赖安装，仅返回依赖列表供用户手动安装。

---

## 一、ESM 与构建策略

### 1.1 当前状态

- `package.json` 已声明 `"type": "module"`
- 构建产出为 ESM（`dist/*.mjs`）
- 依赖多为 ESM-first 或 dual package

### 1.2 浏览器 ESM 策略

| 策略 | 说明 |
|------|------|
| **条件构建** | 通过 `import.meta.env` 或构建时注入 `TARGET: 'browser' | 'node'` 区分双构建 |
| **Single ESM bundle** | 构建单一 ESM 包，通过 `?import` 或 `<script type="module">` 加载 |
| **依赖 externals** | `vue-metamorph`、`@unovue/detypes`、`@vue/*` 已在 Node 构建中 external，浏览器构建需同样 external 或使用 CDN |

### 1.3 推荐构建配置

```ts
// 示例：双入口构建
entry: {
  node: 'src/index.ts',
  browser: 'src/browser.ts',  // 精简入口，仅导出 add 核心逻辑
}
format: ['esm'],
platform: process.env.TARGET === 'browser' ? 'browser' : 'node',
```

---

## 二、依赖逐项评估

### 2.1 完全浏览器兼容（无需处理）

| 依赖 | 用途 | ESM | 说明 |
|------|------|-----|------|
| **zod** | schema 校验 | ✅ | 纯 JS，无 Node API |
| **dedent** | 模板字符串缩进 | ✅ | 纯 JS |
| **deepmerge** | 对象合并 | ✅ | 纯 JS |
| **magic-string** | 源码编辑 | ✅ | 纯 JS |
| **semver** | 版本比较 | ✅ | 纯 JS |
| **stringify-object** | 对象序列化 | ✅ | 纯 JS |
| **pathe** | 路径处理 | ✅ | UnJS 系，设计为 isomorphic |
| **ofetch** | HTTP 请求 | ✅ | fetch-based，浏览器用原生 fetch |
| **memfs** | 内存文件系统 | ✅ | 支持 Node + 浏览器 |

### 2.2 需条件加载 / 替换（场景 A）

| 依赖 | 用途 | 问题 | 方案 |
|------|------|------|------|
| **execa** | `updateDependencies` 执行 npm install | 依赖 `child_process` | **场景 A 中完全跳过**，不进入该分支 |
| **fs-extra** | `NodeFileSystem` | Node fs API | 浏览器使用 `MemFileSystem`，不加载 `fs-extra` |
| **nypm** | 备用包安装 | Node-only | 场景 A 中不调用 |
| **get-tsconfig** | 解析 tsconfig | 内部使用 `fs` 读文件 | 需提供基于 `IFileSystemService` 的封装或预解析 config |
| **cosmiconfig** | 查找 components.json | 使用 `fs` 搜索 | 同上，或改为从传入 Config 初始化 |
| **tinyglobby** |  glob 文件 | 依赖 `fs`（fdir） | 需支持自定义 fs，或提供基于 memfs 的 glob 实现 |

### 2.3 需 Polyfill 或环境适配

| 依赖 | 用途 | 问题 | 方案 |
|------|------|------|------|
| **consola** | 日志 | 使用 `process.stdout` | 有 `/browser` 构建，需保证导入该 build |
| **ora** | 终端 spinner | 使用 ANSI、stream | 浏览器可用简化版（无动画）或替换为无 UI 的 stub |
| **prompts** | 交互式 CLI | 依赖 readline/stream | 浏览器中改为传入预解析的 options，不调用 prompts |
| **process** | `cwd`, `exit`, `env` | 全局对象 | 见下文 Node API 部分 |

### 2.4 复杂依赖（需深入处理）

| 依赖 | 用途 | 问题 | 方案 |
|------|------|------|------|
| **postcss** | CSS 解析与变换 | 可选加载 `fs` | 本身可纯 JS 运行，bundler 能 tree-shake fs；需确保不 import Node 专属模块 |
| **ts-morph** | TS 源码操作 | 默认依赖 Node fs | 存在 `ts-morph-browser`，或使用 JSR 的 browser 构建 |
| **vue-metamorph** | Vue 模板 codemod | 依赖 vue-eslint-parser → Vue compiler | 已 external，浏览器需通过 CDN 或 bundler 正确解析 |
| **@unovue/detypes** | TS 类型擦除 | 依赖 @vue/compiler-dom | 同上，需 external 或正确打包 |
| **tailwindcss** | 仅作类型 | `import type` | 可剥离为纯类型，不参与运行时 |
| **commander** | CLI 解析 | 无 Node 依赖 | 浏览器入口可不用，或仅作参数解析 |
| **undici** | ofetch 底层 / ProxyAgent | Node HTTP | 浏览器用 fetch；ProxyAgent 在 browser 入口可不用 |

### 2.5 仅 Node 构建使用的依赖

场景 A 的浏览器 bundle 中可不包含：

- `execa`
- `fs-extra`
- `nypm`
- `@antfu/ni`（getPackageManager）

---

## 三、Node API 替换方案

### 3.1 直接引用（需替换）

| API | 使用位置 | 替换方案 |
|-----|----------|----------|
| `node:fs` - existsSync | update-files.ts | 使用 `IFileSystemService.fsExtra.existsSync` |
| `node:fs` - promises | NodeFileSystem, migrate-icons | 浏览器不加载 NodeFileSystem，migrate-icons 在场景 A 中可排除 |
| `node:os` - tmpdir() | update-files.ts, update-tailwind-config.ts | 注入 `ITempDirService`，浏览器实现返回 `/tmp`（memfs 路径） |
| `node:crypto` - randomBytes | migrate-icons.ts | 使用 `crypto.getRandomValues` 或 `uuid` 等浏览器可用实现 |
| `process.cwd()` | 多处 | 注入 `ICwdService` 或从 Config 的 `resolvedPaths.cwd` 读取 |
| `process.exit()` | handle-error, preflights, init, add | 替换为 `IExitService`，浏览器实现为 throw 或 callback |
| `process.env` | registry/api, get-package-manager | 注入 `IEnvService`，浏览器实现为 `{}` 或 `window.__ENV__` |

### 3.2 环境抽象接口示例

```ts
// src/services/env/types.ts
export const ICwdServiceId = createId('cwd-service');
export interface ICwdService {
  cwd(): string;
}

export const ITempDirServiceId = createId('temp-dir-service');
export interface ITempDirService {
  tmpdir(): string;
}

export const IExitServiceId = createId('exit-service');
export interface IExitService {
  exit(code: number): never;
}
```

```ts
// 浏览器实现
export class BrowserCwdService implements ICwdService {
  constructor(private root: string = '/') {}
  cwd() { return this.root; }
}

export class BrowserTempDirService implements ITempDirService {
  tmpdir() { return '/tmp'; }  // memfs 内的路径
}

export class BrowserExitService implements IExitService {
  exit(code: number): never {
    throw new Error(`Exit with code ${code}`);
  }
}
```

---

## 四、场景 A 架构调整

### 4.1 流程裁剪

```
┌─────────────────────────────────────────────────────────────────┐
│                    场景 A 浏览器流程                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. 用户传入 Config（或从 memfs 预置的 components.json 解析）       │
│ 2. fetchRegistry() → ofetch ✅                                   │
│ 3. resolveItemsTree() → 纯逻辑 ✅                                │
│ 4. updateTailwindConfig() → IFileSystemService + ITempDirService │
│ 5. updateCssVars() → postcss（纯 JS）✅                           │
│ 6. updateCss() → postcss ✅                                      │
│ 7. ❌ 跳过 updateDependencies() → 返回 deps 列表                   │
│ 8. updateFiles() → IFileSystemService + 替换 existsSync/tmpdir   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 模块排除（Tree-shaking / 条件导入）

| 模块 | 处理 |
|------|------|
| `update-dependencies.ts` | 不 import，或在 browser 入口用空实现 |
| `get-package-manager.ts` | 同上 |
| `NodeFileSystem` | 使用 MemFileSystem |
| `migrate-icons.ts` | 场景 A 可不支持，或后续单独实现 browser 版 |
| `cli.ts` | 浏览器入口不使用，仅保留 `runInit` / `addComponents` 等 |

### 4.3 getConfig 的浏览器替代

`getConfig` 依赖 `cosmiconfig` + `get-tsconfig` + `tinyglobby`，均需 fs。两种思路：

**方案 1：预解析 Config**

```ts
// 调用方在 Node 或上层预处理好 Config，直接传入
await addComponents(['button'], preResolvedConfig, { ... });
```

**方案 2：实现 BrowserConfigLoader**

- 基于 `IFileSystemService`（memfs）实现 `cosmiconfig` 的 `load` 逻辑
- 或实现简单的 `loadConfigFromJSON(config: RawConfig)`，跳过文件搜索
- `get-tsconfig`：从 memfs 读取 tsconfig 内容，用 `parseTsconfig` 只做解析（不读盘）
- `tinyglobby`：需支持自定义 fs，或使用 `memfs` 的 `vol.readdirSync` 等自行实现 glob

---

## 五、Polyfill 清单

### 5.1 必须

| Polyfill | 原因 | 推荐方案 |
|----------|------|----------|
| **process** | 多处使用 `process.cwd()`, `process.env`, `process.exit` | 使用 `process` 包（browser 字段）或自定义 lightweight polyfill |
| **Buffer** | 若 memfs / 某依赖使用 Buffer | `buffer` 包 或 `feross/buffer` |

### 5.2 可选

| Polyfill | 场景 | 说明 |
|----------|------|------|
| **path** | 若仍有裸 `path` 引用 | 已用 `pathe`，无需 node `path` |
| **crypto** | migrate-icons 等 | `randomBytes` 可用 `crypto.getRandomValues` 替代 |

### 5.3 process 轻量 polyfill 示例

```ts
// browser-polyfills/process.ts
const processPolyfill = {
  cwd: () => '/',
  env: (typeof globalThis !== 'undefined' && (globalThis as any).__ENV__) || {},
  exit: (code: number) => { throw new Error(`Exit ${code}`); },
};
export default processPolyfill;
```

---

## 六、打包与产物

### 6.1 构建目标

```ts
// tsdown / vite / rolldown 等
{
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  external: [
    'vue-metamorph',
    '@unovue/detypes',
    /^@vue\//,
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.REGISTRY_URL': '"https://..."',
  },
  alias: {
    'node:fs': false,      // 或指向 empty module
    'node:os': false,
    'node:crypto': 'crypto-browserify',
  },
}
```

### 6.2 产物形态

| 形态 | 适用 | 说明 |
|------|------|------|
| 单文件 ESM | `<script type="module">` | 适合快速集成 |
| chunk 分割 | 大型应用 | 按路由 / 功能懒加载 |
| CDN | 独立 demo | 如 `https://cdn.jsdelivr.net/npm/uni-cn@x/browser/+esm` |

---

## 七、依赖 ESM 支持情况

| 依赖 | ESM | CJS | 备注 |
|------|-----|-----|------|
| zod | ✅ | ✅ | dual |
| commander | ✅ | ✅ | dual |
| consola | ✅ | ✅ | 需使用 `/browser` |
| cosmiconfig | ✅ | ✅ | 8.x ESM-first |
| dedent | ✅ | ✅ | |
| deepmerge | ✅ | ✅ | |
| execa | ✅ | - | Node-only，bundle 中排除 |
| fs-extra | ✅ | ✅ | Node-only，bundle 中排除 |
| get-tsconfig | ✅ | - | 需 fs，需封装 |
| magic-string | ✅ | ✅ | |
| memfs | ✅ | - | 支持 browser |
| ofetch | ✅ | - | fetch-based |
| ora | ✅ | - | 可 stub |
| pathe | ✅ | - | UnJS ESM |
| postcss | ✅ | ✅ | |
| prompts | ✅ | - | 可 stub |
| semver | ✅ | ✅ | |
| stringify-object | ✅ | ✅ | |
| tailwindcss | 类型仅 | - | 可剥离 |
| tinyglobby | ✅ | - | 需 fs 封装 |
| ts-morph | ✅ | - | 考虑 ts-morph-browser |
| undici | ✅ | - | 可排除 ProxyAgent |
| vue-metamorph | ✅ | - | external |
| @unovue/detypes | ✅ | - | external |

---

## 八、工作量与风险（场景 A）

| 类别 | 预估 | 说明 |
|------|------|------|
| 环境抽象（cwd/tmpdir/exit/env） | 1–2 天 | 新增接口与 Node/Browser 实现 |
| 替换直接 Node API 调用 | 1 天 | existsSync、tmpdir、process.* |
| getConfig / glob / get-tsconfig 封装 | 2–3 天 | 依赖 IFileSystemService 或预解析 |
| 跳过 updateDependencies 分支 | 0.5 天 | 条件分支或单独 browser 入口 |
| Browser 入口与构建配置 | 1 天 | tsdown/vite 双 target |
| 依赖替换 / Polyfill | 0.5–1 天 | process、consola/ora/prompts |
| **合计** | **约 6–9 人天** | |

### 风险

- **ts-morph**：browser 版 API 可能略有差异，需验证
- **vue-metamorph / @unovue/detypes**：若需 bundle 进浏览器，体积与兼容性需验证；优先保持 external + CDN
- **postcss**：确认构建时无隐性 Node 依赖

---

## 九、建议实施顺序

1. 搭建 browser 构建，产出空 ESM 包并验证加载
2. 实现 `ICwdService`、`ITempDirService`、`IExitService` 及 Browser 实现
3. 替换所有直接 `process.*`、`tmpdir`、`existsSync` 调用
4. 实现 `BrowserConfigLoader` 或确立「预解析 Config」的调用约定
5. 实现场景 A 的 `addComponents` 流程，排除 `updateDependencies`
6. 接入 MemFileSystem，跑通完整 add 流程
7. 补充 process 等 polyfill，处理 consola/ora/prompts
8. 集成测试与文档更新
