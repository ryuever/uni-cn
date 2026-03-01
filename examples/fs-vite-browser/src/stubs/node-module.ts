/**
 * Stub for node:module - Node module system. Minimal exports for browser.
 */
export function createRequire() {
  return () => {};
}
export const builtinModules = [] as string[];
export default { createRequire, builtinModules };
