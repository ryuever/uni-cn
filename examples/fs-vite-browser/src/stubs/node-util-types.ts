/**
 * Stub for node:util/types - used by undici etc. in browser.
 */
export const isArrayBuffer = (v: unknown): v is ArrayBuffer =>
  typeof ArrayBuffer !== 'undefined' && v instanceof ArrayBuffer;
export const isArrayBufferView = (v: unknown): v is ArrayBufferView =>
  v != null && typeof (v as ArrayBufferView).buffer === 'object';
// Minimal exports for browser compatibility
export default { isArrayBuffer, isArrayBufferView };
