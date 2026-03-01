/**
 * Stub for supports-color - terminal color support. Browser has none.
 */
const noop = () => ({ level: 0, hasBasic: false, has256: false, has16m: false });
export default noop;
export const stdout = noop();
export const stderr = noop();
