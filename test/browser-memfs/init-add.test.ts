import { Volume } from 'memfs';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { runInitWithVolume } from '@/browser/run-init';
import { runAddWithVolume } from '@/browser/run-add';
import { buildMemfsConfig, defaultMemfsRawConfig } from '@/browser/config';
import { clearRegistryCache } from '@/registry/api';
import type { RawConfig } from '@/utils/get-config';

import { PREPARE_VUE_PROJECT_FILES } from '../../examples/fs-vite-browser/src/data/prepareViteVueProject';
import { INIT_VUE_PROJECT_FILES } from '../../examples/fs-vite-browser/src/data/initViteVueProject';
import { ADD_BUTTON_VUE_PROJECT_FILES } from '../../examples/fs-vite-browser/src/data/addButtonInViteVueProject';

import {
  populateVolume,
  assertVolumeContains,
  assertFileExists,
  readJsonFromVolume,
} from './helpers';
import {
  REGISTRY_URL,
  REGISTRY_INDEX,
  STYLE_INDEX,
  STYLE_UTILS,
  STYLE_BUTTON,
  COLORS_NEUTRAL,
  ICONS_INDEX,
} from './registry-fixtures';

// ── Log capture infrastructure ──────────────────────────────────────────────
const logMessages: string[] = [];

vi.mock('@/utils/highlighter', () => ({
  highlighter: {
    error: (s: string) => s,
    warn: (s: string) => s,
    info: (s: string) => s,
    success: (s: string) => s,
  },
}));

vi.mock('@/utils/spinner', () => ({
  spinner: (text: string, _options?: { silent?: boolean }) => {
    const instance = {
      start: () => instance,
      succeed: (newText?: string) => {
        logMessages.push(`✔ ${newText ?? text}`);
        return instance;
      },
      fail: (newText?: string) => {
        logMessages.push(`✖ ${newText ?? text}`);
        return instance;
      },
      info: (newText?: string) => {
        logMessages.push(`ℹ ${newText ?? text}`);
        return instance;
      },
      stop: () => instance,
    };
    return instance;
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    log: (...args: unknown[]) => { logMessages.push(args.join(' ')); },
    info: (...args: unknown[]) => { logMessages.push(args.join(' ')); },
    success: (...args: unknown[]) => { logMessages.push(args.join(' ')); },
    warn: (...args: unknown[]) => { logMessages.push(args.join(' ')); },
    error: (...args: unknown[]) => { logMessages.push(args.join(' ')); },
    break: () => { logMessages.push(''); },
  },
}));

const ROOT = '/project';

const server = setupServer(
  http.get(`${REGISTRY_URL}/index.json`, () => {
    return HttpResponse.json(REGISTRY_INDEX);
  }),
  http.get(`${REGISTRY_URL}/styles/new-york/index.json`, () => {
    return HttpResponse.json(STYLE_INDEX);
  }),
  http.get(`${REGISTRY_URL}/styles/new-york/utils.json`, () => {
    return HttpResponse.json(STYLE_UTILS);
  }),
  http.get(`${REGISTRY_URL}/styles/new-york/button.json`, () => {
    return HttpResponse.json(STYLE_BUTTON);
  }),
  http.get(`${REGISTRY_URL}/colors/neutral.json`, () => {
    return HttpResponse.json(COLORS_NEUTRAL);
  }),
  http.get(`${REGISTRY_URL}/icons/index.json`, () => {
    return HttpResponse.json(ICONS_INDEX);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());

beforeEach(() => {
  logMessages.length = 0;
  clearRegistryCache();
});

afterEach(() => {
  server.resetHandlers();
});

function buildNeutralConfig(root: string) {
  const rawConfig: RawConfig = {
    ...defaultMemfsRawConfig,
    tailwind: {
      ...defaultMemfsRawConfig.tailwind,
      baseColor: 'neutral',
    },
  };
  return buildMemfsConfig(root, rawConfig);
}

describe('browser-memfs: init command', () => {
  it('should write components.json with correct config', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, PREPARE_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runInitWithVolume(vol, ROOT, config, { skipAddComponents: true, silent: false });

    assertFileExists(vol, ROOT, 'components.json');

    const componentsJson = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'components.json');
    const expectedComponentsJson = JSON.parse(INIT_VUE_PROJECT_FILES['components.json']);

    expect(componentsJson.$schema).toBe(expectedComponentsJson.$schema);
    expect(componentsJson.style).toBe(expectedComponentsJson.style);
    expect(componentsJson.typescript).toBe(expectedComponentsJson.typescript);
    expect(componentsJson.tailwind).toEqual(expectedComponentsJson.tailwind);
    expect(componentsJson.aliases).toEqual(expectedComponentsJson.aliases);
    expect(componentsJson.iconLibrary).toBe(expectedComponentsJson.iconLibrary);
    expect(componentsJson.resolvedPaths).toBeUndefined();

    expect(logMessages).toContainEqual('✔ Writing components.json.');
  });

  it('should run full init flow: components.json + CSS vars + utils.ts + package.json', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, PREPARE_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runInitWithVolume(vol, ROOT, config, { skipAddComponents: false, silent: false });

    assertFileExists(vol, ROOT, 'components.json');
    assertFileExists(vol, ROOT, 'src/lib/utils.ts');
    assertFileExists(vol, ROOT, 'src/style.css');

    const componentsJson = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'components.json');
    const expectedComponentsJson = JSON.parse(INIT_VUE_PROJECT_FILES['components.json']);
    expect(componentsJson.style).toBe(expectedComponentsJson.style);
    expect(componentsJson.tailwind).toEqual(expectedComponentsJson.tailwind);
    expect(componentsJson.aliases).toEqual(expectedComponentsJson.aliases);
    expect(componentsJson.resolvedPaths).toBeUndefined();

    const utils = vol.readFileSync(`${ROOT}/src/lib/utils.ts`, 'utf-8') as string;
    expect(utils.trim()).toBe(INIT_VUE_PROJECT_FILES['src/lib/utils.ts'].trim());

    const pkg = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'package.json');
    const expectedPkg = JSON.parse(INIT_VUE_PROJECT_FILES['package.json']);
    for (const dep of Object.keys(expectedPkg.dependencies)) {
      expect(pkg.dependencies, `Missing dependency: ${dep}`).toHaveProperty(dep);
    }
    for (const dep of Object.keys(expectedPkg.devDependencies)) {
      expect(pkg.devDependencies, `Missing devDependency: ${dep}`).toHaveProperty(dep);
    }

    const css = vol.readFileSync(`${ROOT}/src/style.css`, 'utf-8') as string;
    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain('@import "tw-animate-css"');
    expect(css).toContain('@custom-variant dark (&:is(.dark *))');
    expect(css).toContain('@theme inline');
    expect(css).toContain('--color-background: var(--background)');
    expect(css).toContain('--color-foreground: var(--foreground)');
    expect(css).toContain('--radius-sm: calc(var(--radius) - 4px)');
    expect(css).toContain('--radius-lg: var(--radius)');
    expect(css).toContain(':root');
    expect(css).toContain('--background: oklch(1 0 0)');
    expect(css).toContain('.dark');
    expect(css).toContain('--background: oklch(0.145 0 0)');
    expect(css).toContain('@layer base');
    expect(css).toContain('@apply bg-background text-foreground');
    expect(css).not.toContain('@plugin');
  });

  it('should produce correct log sequence during full init', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, PREPARE_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runInitWithVolume(vol, ROOT, config, { skipAddComponents: false, silent: false });

    expect(logMessages).toContainEqual('✔ Writing components.json.');
    expect(logMessages).toContainEqual('✔ Checking registry.');
    expect(logMessages).toContainEqual(
      expect.stringContaining('✔ Updating CSS variables in')
    );
    expect(logMessages).toContainEqual('✔ Installing dependencies.');
    expect(logMessages).toContainEqual('✔ Created 1 file:');
    expect(logMessages).toContainEqual('  - src/lib/utils.ts');

    const idxWrite = logMessages.findIndex(m => m.includes('Writing components.json'));
    const idxRegistry = logMessages.findIndex(m => m.includes('Checking registry'));
    const idxCssVars = logMessages.findIndex(m => m.includes('Updating CSS variables'));
    const idxDeps = logMessages.findIndex(m => m.includes('Installing dependencies'));
    const idxCreated = logMessages.findIndex(m => m.includes('Created 1 file'));
    const idxFile = logMessages.findIndex(m => m.includes('src/lib/utils.ts'));

    expect(idxWrite).toBeLessThan(idxRegistry);
    expect(idxRegistry).toBeLessThan(idxCssVars);
    expect(idxCssVars).toBeLessThan(idxDeps);
    expect(idxDeps).toBeLessThan(idxCreated);
    expect(idxCreated).toBeLessThan(idxFile);
  });
});

describe('browser-memfs: add button command', () => {
  it('should add button component files after init', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, INIT_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runAddWithVolume(vol, ROOT, ['button'], config, { silent: false });

    assertFileExists(vol, ROOT, 'src/components/ui/button/Button.vue');
    assertFileExists(vol, ROOT, 'src/components/ui/button/index.ts');

    const buttonVue = vol.readFileSync(
      `${ROOT}/src/components/ui/button/Button.vue`,
      'utf-8'
    ) as string;
    expect(buttonVue.trim()).toBe(
      ADD_BUTTON_VUE_PROJECT_FILES['src/components/ui/button/Button.vue'].trim()
    );

    const buttonIndex = vol.readFileSync(
      `${ROOT}/src/components/ui/button/index.ts`,
      'utf-8'
    ) as string;
    expect(buttonIndex.trim()).toBe(
      ADD_BUTTON_VUE_PROJECT_FILES['src/components/ui/button/index.ts'].trim()
    );
  });

  it('should update package.json with button dependencies', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, INIT_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runAddWithVolume(vol, ROOT, ['button'], config, { silent: false });

    const pkg = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'package.json');
    const expectedPkg = JSON.parse(ADD_BUTTON_VUE_PROJECT_FILES['package.json']);
    for (const dep of Object.keys(expectedPkg.dependencies)) {
      expect(pkg.dependencies, `Missing dependency: ${dep}`).toHaveProperty(dep);
    }
  });

  it('should produce correct log sequence during add button', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, INIT_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);
    await runAddWithVolume(vol, ROOT, ['button'], config, { silent: false });

    expect(logMessages).toContainEqual('✔ Checking registry.');
    expect(logMessages).toContainEqual('✔ Installing dependencies.');
    expect(logMessages).toContainEqual('✔ Created 2 files:');
    expect(logMessages).toContainEqual('  - src/components/ui/button/Button.vue');
    expect(logMessages).toContainEqual('  - src/components/ui/button/index.ts');

    const idxRegistry = logMessages.findIndex(m => m.includes('Checking registry'));
    const idxDeps = logMessages.findIndex(m => m.includes('Installing dependencies'));
    const idxCreated = logMessages.findIndex(m => m.includes('Created 2 files'));
    const idxButtonVue = logMessages.findIndex(m => m.includes('Button.vue'));
    const idxButtonIndex = logMessages.findIndex(m => m.includes('button/index.ts'));

    expect(idxRegistry).toBeLessThan(idxDeps);
    expect(idxDeps).toBeLessThan(idxCreated);
    expect(idxCreated).toBeLessThan(idxButtonVue);
    expect(idxCreated).toBeLessThan(idxButtonIndex);
  });
});

describe('browser-memfs: full flow (prepare -> init -> add button)', () => {
  it('should produce correct file state and log sequence through the complete flow', async () => {
    const vol = new Volume();
    populateVolume(vol, ROOT, PREPARE_VUE_PROJECT_FILES);

    const config = buildNeutralConfig(ROOT);

    await runInitWithVolume(vol, ROOT, config, { skipAddComponents: false, silent: false });

    assertFileExists(vol, ROOT, 'components.json');
    const initComponentsJson = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'components.json');
    expect(initComponentsJson.style).toBe('new-york');
    expect(initComponentsJson.tailwind.baseColor).toBe('neutral');
    expect(initComponentsJson.resolvedPaths).toBeUndefined();

    assertVolumeContains(vol, ROOT, {
      'src/lib/utils.ts': INIT_VUE_PROJECT_FILES['src/lib/utils.ts'],
    });

    // Verify init logs
    expect(logMessages).toContainEqual('✔ Writing components.json.');
    expect(logMessages).toContainEqual('✔ Checking registry.');
    expect(logMessages).toContainEqual(
      expect.stringContaining('✔ Updating CSS variables in')
    );
    expect(logMessages).toContainEqual('✔ Installing dependencies.');
    expect(logMessages).toContainEqual('✔ Created 1 file:');
    expect(logMessages).toContainEqual('  - src/lib/utils.ts');

    const initLogCount = logMessages.length;

    await runAddWithVolume(vol, ROOT, ['button'], config, { silent: false });

    assertVolumeContains(vol, ROOT, {
      'src/components/ui/button/Button.vue':
        ADD_BUTTON_VUE_PROJECT_FILES['src/components/ui/button/Button.vue'],
      'src/components/ui/button/index.ts':
        ADD_BUTTON_VUE_PROJECT_FILES['src/components/ui/button/index.ts'],
    });

    const pkg = readJsonFromVolume<Record<string, any>>(vol, ROOT, 'package.json');
    expect(pkg.dependencies['reka-ui']).toBeDefined();
    expect(pkg.dependencies['class-variance-authority']).toBeDefined();
    expect(pkg.dependencies['clsx']).toBeDefined();
    expect(pkg.dependencies['tailwind-merge']).toBeDefined();
    expect(pkg.dependencies['lucide-vue-next']).toBeDefined();

    // Verify add logs appear after init logs
    const addLogs = logMessages.slice(initLogCount);
    expect(addLogs).toContainEqual('✔ Checking registry.');
    expect(addLogs).toContainEqual('✔ Installing dependencies.');
    expect(addLogs).toContainEqual('✔ Created 2 files:');
    expect(addLogs).toContainEqual('  - src/components/ui/button/Button.vue');
    expect(addLogs).toContainEqual('  - src/components/ui/button/index.ts');
  });
});
