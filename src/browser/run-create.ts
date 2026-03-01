import type { Volume } from 'memfs';
import { runAddTemplateWithVolume } from './run-add';
import type { RunAddTemplateWithVolumeOptions } from './run-add';

/** @deprecated Use `runAddTemplateWithVolume` instead. */
export type RunCreateOptions = RunAddTemplateWithVolumeOptions;

/**
 * @deprecated Use `runAddTemplateWithVolume` instead.
 *
 * Run create against a memfs Volume. Delegates to `runAddTemplateWithVolume`.
 */
export async function runCreateWithVolume(
  vol: Volume,
  root: string,
  options: RunCreateOptions = {}
) {
  return runAddTemplateWithVolume(vol, root, options);
}
