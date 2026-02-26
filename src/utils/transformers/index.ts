import { createId, inject, injectable } from '@/delightless-vue/di';
import { getRegistryIcons } from '@/delightless-vue/registry/api';
import type { registryBaseColorSchema } from '@/delightless-vue/registry/schema';
import type { Config } from '@/delightless-vue/utils/get-config';
import { transformCssVars } from '@/delightless-vue/utils/transformers/transform-css-vars';
import { transformImport } from '@/delightless-vue/utils/transformers/transform-import';
import { transformSFC } from '@/delightless-vue/utils/transformers/transform-sfc';
import type { TransformTwPrefixService } from '@/delightless-vue/utils/transformers/transform-tw-prefix';
import { TransformTwPrefixServiceId } from '@/delightless-vue/utils/transformers/transform-tw-prefix';

import type { z } from 'zod';

import { transform as metaTransform } from 'vue-metamorph';

import { transformIcons } from './transform-icons';

export interface TransformOpts {
  filename: string;
  raw: string;
  config: Config;
  baseColor?: z.infer<typeof registryBaseColorSchema>;
  isRemote?: boolean;
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

// export async function transform(opts: TransformOpts) {
//   const source = await transformSFC(opts);

//   const registryIcons = await getRegistryIcons();

//   return metaTransform(source, opts.filename, [
//     transformImport(opts),
//     transformCssVars(opts),
//     await transformTwPrefix(opts),
//     transformIcons(opts, registryIcons),
//   ]).code;
// }
