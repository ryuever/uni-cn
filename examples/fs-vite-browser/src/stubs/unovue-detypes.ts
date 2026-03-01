/**
 * Stub for @unovue/detypes - uses @vuedx/template-ast-types -> @vue/compiler-core (browser-incompatible)
 * For browser init we skip full TS stripping; return content as-is when typescript is disabled
 */
export async function transform(
  content: string,
  _filename: string,
  _opts?: Record<string, unknown>
): Promise<string> {
  return content;
}
