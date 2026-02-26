import { Volume } from 'memfs';
import path from 'pathe';
import {
  projectContent,
} from './content';

export type { projectContent };

/**
 * Populate a memfs Volume with project files from content.ts.
 * Returns the Volume so it can be passed to MemFileSystem or used for verification.
 *
 * @param root - Base path for the virtual project (e.g. '/project' or '/tmp/project')
 * @returns The populated Volume
 */
export function populateMemfs(root: string = '/project'): Volume {
  const vol = new Volume();

  // Ensure root exists
  vol.mkdirSync(root, { recursive: true });

  // Write all project files
  for (const [relativePath, content] of Object.entries(projectContent)) {
    const fullPath = path.join(root, relativePath);
    const dir = path.dirname(fullPath);

    vol.mkdirSync(dir, { recursive: true });
    vol.writeFileSync(fullPath, content, 'utf-8');
  }

  return vol;
}

/**
 * Get a populated Volume and its root path.
 * Convenience for tests / verification.
 */
export function getPopulatedVolume(root: string = '/project') {
  const vol = populateMemfs(root);
  return { vol, root };
}
