/**
 * Browser stub for node:url - fileURLToPath
 * In browser we just return the pathname (no file system)
 */
export function fileURLToPath(url: string | URL): string {
  if (typeof url === 'string') {
    return new URL(url).pathname;
  }
  return url.pathname;
}

export const URL = globalThis.URL;
