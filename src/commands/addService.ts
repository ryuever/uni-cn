import {
  AddCommandService,
  AddCommandServiceId,
} from '@/delightless-vue/commands/add';
import {
  InitCommandService,
  InitCommandServiceId,
  PromptForMinimalConfigService,
  PromptForMinimalConfigServiceId,
} from '@/delightless-vue/commands/init';
import { Container, Registry } from '@/delightless-vue/di';
import {
  PreFlightAddService,
  PreFlightAddServiceId,
} from '@/delightless-vue/preflights/preflight-add';
import {
  PreFlightInitService,
  PreFlightInitServiceId,
} from '@/delightless-vue/preflights/preflight-init';
import {
  RegistryGetThemeService,
  RegistryGetThemeServiceId,
  RegistryResolveItemsTreeService,
  RegistryResolveItemsTreeServiceId,
} from '@/delightless-vue/registry/api';
import { FileSystemServiceId } from '@/delightless-vue/services/file-system/constants';
import { FileSystemService } from '@/delightless-vue/services/file-system/NodeFileSystem';
import {
  AddComponentsService,
  AddComponentsServiceId,
  AddProjectComponentsService,
  AddProjectComponentsServiceId,
  AddWorkspaceComponentsService,
  AddWorkspaceComponentsServiceId,
} from '@/delightless-vue/utils/add-components';
import {
  GetPackageInfoService,
  GetPackageInfoServiceId,
} from '@/delightless-vue/utils/get-package-info';
import {
  GetProjectConfigService,
  GetProjectConfigServiceId,
  GetProjectInfoService,
  GetProjectInfoServiceId,
  GetProjectTailwindVersionFromConfigService,
  GetProjectTailwindVersionFromConfigServiceId,
  GetTailwindCssFileService,
  GetTailwindCssFileServiceId,
  GetTailwindVersionService,
  GetTailwindVersionServiceId,
  GetTsConfigService,
  GetTsConfigServiceId,
} from '@/delightless-vue/utils/get-project-info';
import {
  TransformersService,
  TransformersServiceId,
} from '@/delightless-vue/utils/transformers';
import {
  TransformTwPrefixService,
  TransformTwPrefixServiceId,
} from '@/delightless-vue/utils/transformers/transform-tw-prefix';
import {
  UpdateCssService,
  UpdateCssServiceId,
} from '@/delightless-vue/utils/updaters/update-css';
import {
  TransformCssVarsService,
  TransformCssVarsServiceId,
  UpdateCssVarsService,
  UpdateCssVarsServiceId,
} from '@/delightless-vue/utils/updaters/update-css-vars';
import {
  ResolveImportsService,
  ResolveImportsServiceId,
  UpdateFilesService,
  UpdateFilesServiceId,
} from '@/delightless-vue/utils/updaters/update-files';
import {
  AddTailwindConfigThemeService,
  AddTailwindConfigThemeServiceId,
  CreateSourceFileService,
  CreateSourceFileServiceId,
  ParseObjectLiteralService,
  ParseObjectLiteralServiceId,
  TransformTailwindConfigService,
  TransformTailwindConfigServiceId,
  UpdateTailwindConfigService,
  UpdateTailwindConfigServiceId,
} from '@/delightless-vue/utils/updaters/update-tailwind-config';
import {
  TransformTailwindContentService,
  TransformTailwindContentServiceId,
  UpdateTailwindContentService,
  UpdateTailwindContentServiceId,
} from '@/delightless-vue/utils/updaters/update-tailwind-content';

export const addServiceModules = new Registry((bind) => {
  bind(AddCommandServiceId).to(AddCommandService);
  bind(InitCommandServiceId).to(InitCommandService);
  bind(PromptForMinimalConfigServiceId).to(PromptForMinimalConfigService);
  bind(PreFlightAddServiceId).to(PreFlightAddService);
  bind(PreFlightInitServiceId).to(PreFlightInitService);
  bind(RegistryResolveItemsTreeServiceId).to(RegistryResolveItemsTreeService);
  bind(RegistryGetThemeServiceId).to(RegistryGetThemeService);
  bind(AddComponentsServiceId).to(AddComponentsService);
  bind(AddProjectComponentsServiceId).to(AddProjectComponentsService);
  bind(AddWorkspaceComponentsServiceId).to(AddWorkspaceComponentsService);
  bind(GetPackageInfoServiceId).to(GetPackageInfoService);
  bind(GetProjectConfigServiceId).to(GetProjectConfigService);
  bind(GetProjectInfoServiceId).to(GetProjectInfoService);
  bind(GetProjectTailwindVersionFromConfigServiceId).to(
    GetProjectTailwindVersionFromConfigService
  );
  bind(GetTailwindCssFileServiceId).to(GetTailwindCssFileService);
  bind(GetTailwindVersionServiceId).to(GetTailwindVersionService);
  bind(GetTsConfigServiceId).to(GetTsConfigService);
  bind(TransformersServiceId).to(TransformersService);
  bind(TransformTwPrefixServiceId).to(TransformTwPrefixService);
  bind(TransformCssVarsServiceId).to(TransformCssVarsService);
  bind(UpdateCssVarsServiceId).to(UpdateCssVarsService);
  bind(TransformTailwindContentServiceId).to(TransformTailwindContentService);
  bind(UpdateTailwindContentServiceId).to(UpdateTailwindContentService);
  bind(ResolveImportsServiceId).to(ResolveImportsService);
  bind(UpdateFilesServiceId).to(UpdateFilesService);
  bind(TransformTailwindConfigServiceId).to(TransformTailwindConfigService);
  bind(AddTailwindConfigThemeServiceId).to(AddTailwindConfigThemeService);
  bind(CreateSourceFileServiceId).to(CreateSourceFileService);
  bind(ParseObjectLiteralServiceId).to(ParseObjectLiteralService);
  bind(UpdateTailwindConfigServiceId).to(UpdateTailwindConfigService);
  bind(UpdateCssServiceId).to(UpdateCssService);
  bind(FileSystemServiceId).to(FileSystemService);
});

// const container = new Container();
// container.load(modules);

// export const addService: AddCommandService = container.get(AddCommandServiceId);

// addService.runAdd(['button', 'input', 'range-calendar', 'select'], {
//   cwd: '/Users/ryu/Documents/code/modules/headless/shadcn-vue-test',
//   yes: true,
//   overwrite: true,
//   all: true,
//   silent: true,
//   cssVariables: false,
// });
