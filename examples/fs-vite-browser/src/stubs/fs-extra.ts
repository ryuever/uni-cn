/**
 * Stub for fs-extra - Node fs. Browser init uses MemFileSystem; this is only for module load.
 */
const noop = () => {};
const noopAsync = async () => {};
export const pathExists = noopAsync;
export const existsSync = () => false;
export const readJsonSync = () => ({});
export default {
  pathExists,
  existsSync,
  readJsonSync,
  readJson: noopAsync,
  writeJson: noopAsync,
  ensureDir: noopAsync,
  copy: noopAsync,
  remove: noopAsync,
};
