import {
  CreateCommandService,
  CreateCommandServiceId,
} from '@/commands/create';
import { Registry } from '@/di';
import { FileSystemServiceId } from '@/services/file-system/constants';
import { NodeFileSystem } from '@/services/file-system/NodeFileSystem';
import {
  CreateTemplateFilesService,
  CreateTemplateFilesServiceId,
} from '@/utils/updaters/create-template-files';
// import { TransformTailwindConfigService } from '@/utils/updaters/update-tailwind-config';
// import { TransformTailwindConfigServiceId } from '@/utils/updaters/update-tailwind-config';

export const createServiceModules = new Registry((bind) => {
  bind(CreateCommandServiceId).to(CreateCommandService);
  bind(CreateTemplateFilesServiceId).to(CreateTemplateFilesService);
  bind(FileSystemServiceId).to(NodeFileSystem);
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
