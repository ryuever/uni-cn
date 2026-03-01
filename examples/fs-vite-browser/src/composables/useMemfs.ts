import { ref, shallowRef } from 'vue';
import { Volume } from 'memfs';
import {
  runInitWithVolume,
  runAddWithVolume,
  runAddTemplateWithVolume,
  buildMemfsConfig,
  defaultMemfsRawConfig,
  setLogListener,
} from 'uni-cn/browser';
import type { RawConfig, LogEntry } from 'uni-cn/browser';
import { INITIAL_PROJECT_FILES } from '../data/initialViteVueProject';
import { PREPARE_VUE_PROJECT_FILES } from '../data/prepareViteVueProject';

const ROOT = '/project';

export function useMemfs() {
  const vol = shallowRef<Volume>(new Volume());
  const root = ref(ROOT);
  const selectedPath = ref<string | null>(null);
  const logLines = ref<string[]>([]);
  const refreshKey = ref(0);

  function ensureProject() {
    const v = vol.value;
    try {
      v.mkdirSync(root.value, { recursive: true });
      if (!v.existsSync(`${root.value}/package.json`)) {
        for (const [relativePath, content] of Object.entries(INITIAL_PROJECT_FILES)) {
          const fullPath = `${root.value}/${relativePath}`.replace(/\/+/g, '/');
          const parentDir = fullPath.replace(/\/[^/]+$/, '');
          v.mkdirSync(parentDir, { recursive: true });
          v.writeFileSync(fullPath, content, { encoding: 'utf-8' });
        }
      }
    } catch {
      // ignore
    }
  }

  function writeLog(line: string) {
    logLines.value = [...logLines.value, line];
  }

  function clearLogs() {
    logLines.value = [];
  }

  function formatLogEntry(entry: LogEntry): string {
    if (entry.status === 'break') return '';
    const prefix =
      entry.type === 'spinner'
        ? entry.status === 'succeed' ? '✔' : entry.status === 'fail' ? '✖' : 'ℹ'
        : '';
    return prefix ? `${prefix} ${entry.text}` : entry.text;
  }

  function withLogListener<T>(fn: () => Promise<T>): Promise<T> {
    setLogListener((entry) => writeLog(formatLogEntry(entry)));
    return fn().finally(() => setLogListener(null));
  }

  /**
   * Overwrite project files with the "prepare" state (Tailwind v4 + @ alias configured).
   * Call this before runInit to ensure the init flow produces the expected output.
   */
  function prepareForInit() {
    const v = vol.value;
    for (const [relativePath, content] of Object.entries(PREPARE_VUE_PROJECT_FILES)) {
      const fullPath = `${root.value}/${relativePath}`.replace(/\/+/g, '/');
      const parentDir = fullPath.replace(/\/[^/]+$/, '');
      v.mkdirSync(parentDir, { recursive: true });
      v.writeFileSync(fullPath, content, { encoding: 'utf-8' });
    }
    refreshKey.value++;
  }

  async function runInit(options: { style?: string; baseColor?: string; skipAddComponents?: boolean } = {}) {
    ensureProject();
    clearLogs();
    writeLog(`$ npx uni-cn init`);
    writeLog('Running init...');
    try {
      const rawConfig: RawConfig = {
        ...defaultMemfsRawConfig,
        style: options.style ?? 'new-york',
        tailwind: {
          ...defaultMemfsRawConfig.tailwind,
          baseColor: options.baseColor ?? 'zinc',
        },
      };
      const config = buildMemfsConfig(root.value, rawConfig);
      await withLogListener(() =>
        runInitWithVolume(vol.value, root.value, config, {
          skipAddComponents: options.skipAddComponents ?? false,
          silent: false,
        })
      );
      refreshKey.value++;
      writeLog('Init complete.');
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      writeLog(`Error: ${msg}`);
      throw e;
    }
  }

  async function runCreate(options: {
    template?: string;
    style?: string;
    name?: string;
  } = {}) {
    ensureProject();
    clearLogs();
    writeLog(`$ npx uni-cn add template ${options.template ?? 'default'}`);
    writeLog('Running add template...');
    try {
      await withLogListener(() =>
        runAddTemplateWithVolume(vol.value, root.value, {
          template: options.template ?? 'default',
          style: options.style ?? 'default',
          name: options.name ?? 'my-project',
        })
      );
      refreshKey.value++;
      writeLog('Add template complete.');
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      writeLog(`Error: ${msg}`);
      throw e;
    }
  }

  async function runAdd(components: string[], options?: { style?: string }) {
    ensureProject();
    clearLogs();
    writeLog(`$ npx uni-cn add ${components.join(' ')}`);
    writeLog('Running add...');
    try {
      const rawConfig: RawConfig = {
        ...defaultMemfsRawConfig,
        style: options?.style ?? 'new-york',
      };
      const config = buildMemfsConfig(root.value, rawConfig);
      await withLogListener(() =>
        runAddWithVolume(vol.value, root.value, components, config, {
          silent: false,
        })
      );
      refreshKey.value++;
      writeLog('Add complete.');
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      writeLog(`Error: ${msg}`);
      throw e;
    }
  }

  function getFileContent(path: string): string {
    try {
      const content = vol.value.readFileSync(path, 'utf-8');
      return typeof content === 'string' ? content : String(content);
    } catch {
      return '';
    }
  }

  function setFileContent(path: string, content: string) {
    vol.value.writeFileSync(path, content, { encoding: 'utf-8' });
  }

  function buildFileTree(dir: string): TreeNode[] {
    const v = vol.value;
    try {
      const entries = v.readdirSync(dir, { withFileTypes: true }) as Array<{
        name: string;
        isDirectory: () => boolean;
      }>;
      const sorted = [...entries].sort((a, b) => {
        const aDir = a.isDirectory() ? 0 : 1;
        const bDir = b.isDirectory() ? 0 : 1;
        if (aDir !== bDir) return aDir - bDir;
        return a.name.localeCompare(b.name);
      });
      return sorted.map((ent) => {
        const fullPath = `${dir}/${ent.name}`.replace(/\/+/g, '/');
        return {
          name: ent.name,
          path: fullPath,
          isDir: ent.isDirectory(),
          children: ent.isDirectory()
            ? buildFileTree(fullPath)
            : undefined,
        };
      });
    } catch {
      return [];
    }
  }

  return {
    vol,
    root,
    selectedPath,
    logLines,
    refreshKey,
    ensureProject,
    prepareForInit,
    writeLog,
    clearLogs,
    runInit,
    runCreate,
    runAdd,
    getFileContent,
    setFileContent,
    buildFileTree,
  };
}

export interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
}
