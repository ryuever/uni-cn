/**
 * Stub for chalk - terminal colors. Browser has no colors.
 */
const noop = (s: unknown) => (typeof s === 'string' ? s : String(s));
const chalk = Object.assign(noop, {
  red: noop, green: noop, blue: noop, yellow: noop, cyan: noop, magenta: noop,
  bold: noop, dim: noop, italic: noop, underline: noop,
});
export default chalk;
