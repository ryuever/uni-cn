/**
 * Stub for buffer - Node Buffer. Browser uses Uint8Array.
 */
const Buffer = {
  alloc: (size: number) => new Uint8Array(size),
  allocUnsafe: (size: number) => new Uint8Array(size),
  from: (data: unknown) => new Uint8Array(data as ArrayBuffer),
  isBuffer: () => false,
};
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
export default Buffer;
export { Buffer };
