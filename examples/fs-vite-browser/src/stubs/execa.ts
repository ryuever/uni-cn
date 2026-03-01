/** Stub for browser - execa is Node-only */
export function execa() {
  throw new Error('execa is not available in browser');
}
export default execa;
