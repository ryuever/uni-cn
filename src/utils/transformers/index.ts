import { createId, inject, injectable } from '@/di';
import { getRegistryIcons } from '@/registry/api';
import type { registryBaseColorSchema } from '@/registry/schema';
import type { Config } from '@/utils/get-config';
import { transformCssVars } from '@/utils/transformers/transform-css-vars';
import { transformImport } from '@/utils/transformers/transform-import';
import { transformSFC } from '@/utils/transformers/transform-sfc';
import type { TransformTwPrefixService } from '@/utils/transformers/transform-tw-prefix';
import { TransformTwPrefixServiceId } from '@/utils/transformers/transform-tw-prefix';

import type { z } from 'zod';

import { transform as metaTransform } from 'vue-metamorph';

import { transformIcons } from './transform-icons';

export interface TransformOpts {
  filename: string;
  raw: string;
  config: Config;
  baseColor?: z.infer<typeof registryBaseColorSchema>;
  isRemote?: boolean;
  /** When provided, skip getProjectInfo (uses Node fs). For memfs. */
  tailwindVersion?: 'v3' | 'v4';
}

export const TransformersServiceId = createId('transformers-service-id');
@injectable()
export class TransformersService {
  constructor(
    @inject(TransformTwPrefixServiceId)
    private readonly transformTwPrefixService: TransformTwPrefixService
  ) {}

  async transform(opts: TransformOpts) {
    const source = await transformSFC(opts);

    const registryIcons = await getRegistryIcons();

    return metaTransform(source, opts.filename, [
      transformImport(opts),
      transformCssVars(opts),
      await this.transformTwPrefixService.transformTwPrefix(opts),
      transformIcons(opts, registryIcons),
    ]).code;
  }
}

/** Standalone transform for testing - uses DI */
export async function transform(opts: TransformOpts) {
  const { Container } = await import('@/di');
  const { initServiceModules } = await import('@/commands/initService');
  const container = new Container();
  container.load(initServiceModules);
  const service = container.get(TransformersServiceId);
  return service.transform(opts);
}
