/**
 * Stub for node:fs/promises - default export is the promises object.
 */
const noop = async () => {};
export default {
  readFile: noop,
  writeFile: noop,
  mkdir: noop,
  mkdtemp: noop,
  cp: noop,
};
