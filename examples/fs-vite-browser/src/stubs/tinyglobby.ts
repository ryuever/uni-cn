/**
 * Stub for browser - tinyglobby uses fdir/picomatch (Node fs)
 */
export async function glob(
  _patterns: string | string[],
  _options?: Record<string, unknown>
): Promise<string[]> {
  return [];
}
