import { Container } from '@/di';
import { initServiceModules } from './commands/initService';
import type { initOptionsSchema } from './commands/init';
import { InitCommandServiceId } from './commands/init';
import type { z } from 'zod';

export * from './registry/api';
export * from './registry/schema';

/** Run init with options (cwd, yes, defaults, etc.) */
export async function runInit(
  optionsOrConfig:
    | (z.infer<typeof initOptionsSchema> & { skipPreflight?: boolean })
    | import('./utils/get-config').Config
) {
  const container = new Container();
  container.load(initServiceModules);
  const service = container.get(InitCommandServiceId);
  const hasResolvedPaths = optionsOrConfig && 'resolvedPaths' in optionsOrConfig;
  const options = hasResolvedPaths
    ? {
        cwd: (optionsOrConfig as any).resolvedPaths.cwd,
        yes: true,
        defaults: true,
        force: true,
        silent: true,
        isNewProject: false,
        style: 'index',
        cssVariables: true,
        skipPreflight: true,
      }
    : (optionsOrConfig as any);
  return service.runInit(options);
}
