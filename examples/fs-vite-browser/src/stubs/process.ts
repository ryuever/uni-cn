/**
 * Stub for process - Node global. Browser polyfill.
 * Ensures REGISTRY_URL is never set so registry fetches use same-origin /api/registry proxy.
 */
const noopStream = { isTTY: false, write: () => true, end: () => {}, on: () => noopStream };
const _env = typeof globalThis !== 'undefined' && (globalThis as any).process?.env ? (globalThis as any).process.env : {};
const proc = {
  env: { ..._env, REGISTRY_URL: undefined },
  argv: ['browser'],
  cwd: () => '/',
  exit: () => {},
  version: '',
  versions: {},
  platform: 'browser',
  nextTick: (fn: () => void) => queueMicrotask(fn),
  stdout: noopStream,
  stderr: noopStream,
  stdin: noopStream,
};

export const cwd = proc.cwd;
export const env = proc.env;
export const exit = proc.exit;
export const version = proc.version;
export const versions = proc.versions;
export const platform = proc.platform;
export const nextTick = proc.nextTick;
export default proc;
