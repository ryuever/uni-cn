/**
 * Stub for cosmiconfig - Node fs-based config loader. Browser init uses pre-built config.
 */
export function cosmiconfig(_name: string, _opts?: unknown) {
  return {
    search: async (_dir?: string) => null,
    load: async (_path: string) => null,
    clearLoadCache: () => {},
    clearSearchCache: () => {},
    clearCaches: () => {},
  };
}
