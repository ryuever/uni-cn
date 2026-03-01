import type { Volume } from 'memfs';
import path from 'pathe';
import { expect } from 'vitest';

/**
 * Write all entries from a files map into a memfs Volume.
 */
export function populateVolume(
  vol: Volume,
  root: string,
  files: Record<string, string>
) {
  vol.mkdirSync(root, { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    const parentDir = path.dirname(fullPath);
    vol.mkdirSync(parentDir, { recursive: true });
    vol.writeFileSync(fullPath, content, { encoding: 'utf-8' });
  }
}

/**
 * Read all files from a memfs Volume under a root directory,
 * returning a flat Record<relativePath, content>.
 */
export function readVolumeFiles(
  vol: Volume,
  root: string,
  dir: string = root
): Record<string, string> {
  const result: Record<string, string> = {};
  const entries = vol.readdirSync(dir, { withFileTypes: true }) as Array<{
    name: string;
    isDirectory: () => boolean;
  }>;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, readVolumeFiles(vol, root, fullPath));
    } else {
      const relativePath = path.relative(root, fullPath);
      const content = vol.readFileSync(fullPath, 'utf-8');
      result[relativePath] = typeof content === 'string' ? content : String(content);
    }
  }

  return result;
}

/**
 * Assert that specific files in the Volume match the expected content.
 * Skips SVG files and other binary-like content by default.
 */
export function assertVolumeContains(
  vol: Volume,
  root: string,
  expected: Record<string, string>,
  options: { skipPatterns?: RegExp[] } = {}
) {
  const skipPatterns = options.skipPatterns ?? [/\.svg$/];

  for (const [relativePath, expectedContent] of Object.entries(expected)) {
    if (skipPatterns.some((p) => p.test(relativePath))) {
      continue;
    }

    const fullPath = path.join(root, relativePath);
    const exists = vol.existsSync(fullPath);
    expect(exists, `Expected file to exist: ${relativePath}`).toBe(true);

    if (!exists) continue;

    const actual = vol.readFileSync(fullPath, 'utf-8') as string;

    if (relativePath.endsWith('.json')) {
      expect(
        JSON.parse(actual),
        `JSON mismatch in ${relativePath}`
      ).toEqual(JSON.parse(expectedContent));
    } else {
      expect(
        actual.trim(),
        `Content mismatch in ${relativePath}`
      ).toBe(expectedContent.trim());
    }
  }
}

/**
 * Assert that a file exists in the Volume.
 */
export function assertFileExists(vol: Volume, root: string, relativePath: string) {
  const fullPath = path.join(root, relativePath);
  expect(vol.existsSync(fullPath), `Expected file: ${relativePath}`).toBe(true);
}

/**
 * Read and parse a JSON file from the Volume.
 */
export function readJsonFromVolume<T = unknown>(
  vol: Volume,
  root: string,
  relativePath: string
): T {
  const fullPath = path.join(root, relativePath);
  const raw = vol.readFileSync(fullPath, 'utf-8') as string;
  return JSON.parse(raw) as T;
}
