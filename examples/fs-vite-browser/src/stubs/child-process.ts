/**
 * Stub for child_process - Node process spawning. Not available in browser.
 */
function noop() {
  return { on: () => {}, kill: () => {}, stdout: {}, stderr: {}, stdin: {} };
}
export const spawn = noop;
export const exec = noop;
export const execSync = noop;
export const fork = noop;
export default { spawn, exec, execSync, fork };
