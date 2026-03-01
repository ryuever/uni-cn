/**
 * Stub for node:fs - Node fs. Browser init uses MemFileSystem; NodeFileSystem is only loaded for DI.
 * node:fs/promises expects default = promises object; node:fs expects default = { promises }.
 */
const noop = async () => {};
const promises = {
  readFile: noop,
  writeFile: noop,
  mkdir: noop,
  mkdtemp: noop,
  cp: noop,
};
export { promises };
export default { promises };
