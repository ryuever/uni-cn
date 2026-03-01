/**
 * Stub for browser - vue-metamorph uses @vue/compiler-core (complex deps)
 * Init with skipAddComponents never uses transform; this avoids the chain
 */
export function transform(_source: string, _filename: string, _transforms: unknown[]): { code: string } {
  return { code: _source };
}
