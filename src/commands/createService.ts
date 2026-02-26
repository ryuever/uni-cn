import {
  CreateCommandService,
  CreateCommandServiceId,
} from '@/delightless-vue/commands/create';
import { Registry } from '@/delightless-vue/di';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import { FileSystemService } from '@/delightless-vue/services/file-system/NodeFileSystem';
import {
  CreateTemplateFilesService,
  CreateTemplateFilesServiceId,
} from '@/delightless-vue/utils/updaters/create-template-files';
// import { TransformTailwindConfigService } from '@/delightless-vue/utils/updaters/update-tailwind-config';
// import { TransformTailwindConfigServiceId } from '@/delightless-vue/utils/updaters/update-tailwind-config';

export const createServiceModules = new Registry((bind) => {
  bind(CreateCommandServiceId).to(CreateCommandService);
  bind(CreateTemplateFilesServiceId).to(CreateTemplateFilesService);
  bind(FileSystemServiceId).to(FileSystemService);
  // bind(TransformTailwindConfigServiceId).to(TransformTailwindConfigService);
});

// export const createServiceContainer = new Container();
// createServiceContainer.load(modules);

// export const createService = createServiceContainer.get(CreateCommandServiceId);

// createService.runCreate({
//   cwd: '/Users/ryu/Documents/code/red/delightless-test',
//   name: 'my-project',
//   template: 'template-vue-ts',
//   style: 'default',
// });
