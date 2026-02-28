/**
 * Exit or throw - works in both Node and browser.
 * In Node: calls process.exit(code)
 * In browser: throws (process.exit not available)
 */
export function exitOrThrow(code: number): never {
  if (typeof process !== 'undefined' && typeof process.exit === 'function') {
    process.exit(code);
  }
  throw new Error(`Exit with code ${code}`);
}
